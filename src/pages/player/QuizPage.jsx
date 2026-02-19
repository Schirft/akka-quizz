import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useLang } from '../../hooks/useLang'
import { t as tRaw } from '../../config/i18n'
import { supabase } from '../../lib/supabase'
import {
  QUESTION_TIMER_SECONDS,
  TIMER_CRITICAL_SECONDS,
  XP_CORRECT_ANSWER,
  XP_SPEED_BONUS_FAST,
  XP_SPEED_BONUS_MEDIUM,
  XP_QUIZ_STARTED,
  XP_PERFECT_QUIZ,
  SPEED_FAST_THRESHOLD,
  SPEED_MEDIUM_THRESHOLD,
} from '../../config/constants'
import {
  playCorrect,
  playWrong,
  playTimerTick,
  playTap,
  isMuted,
  toggleMute,
} from '../../lib/sounds'
import Button from '../../components/ui/Button'
import TabBar from '../../components/layout/TabBar'
import { getRandomEncouragement, getQuizText } from '../../utils/quizI18n'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Lightbulb,
  Play,
} from 'lucide-react'

/**
 * QuizPage — Pack-based quiz experience.
 *
 * Flow: 3 QCM (with timer, gamification) → Puzzle → Celebration → Lesson → Results
 *
 * Loads today's pack from daily_packs table:
 *   - question_ids: UUID[] (3 questions)
 *   - puzzle_id: UUID (puzzle from puzzles table)
 *   - lesson_id: UUID (lesson from daily_lessons table)
 */
export default function QuizPage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { lang, t, tp } = useLang()
  const navigate = useNavigate()

  // Phase: 'loading' | 'ready' | 'question' | 'feedback' | 'puzzle' | 'celebration' | 'lesson' | 'error'
  const [phase, setPhase] = useState('loading')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS)
  const [timeSpentMs, setTimeSpentMs] = useState(0)
  const [answers, setAnswers] = useState([])
  const [quizId, setQuizId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [xpFloat, setXpFloat] = useState(null)
  const [communityStats, setCommunityStats] = useState(null)
  const [muted, setMutedState] = useState(isMuted)
  const [shakeAnswer, setShakeAnswer] = useState(false)
  const [timerMessage, setTimerMessage] = useState(null)

  // Gamification states
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [showEncouragement, setShowEncouragement] = useState(null)
  const [memberStats, setMemberStats] = useState(null)

  // Pack data
  const [pack, setPack] = useState(null)
  const [puzzle, setPuzzle] = useState(null)
  const [lesson, setLesson] = useState(null)

  // Puzzle state
  const [puzzleAnswered, setPuzzleAnswered] = useState(false)
  const [puzzleCorrect, setPuzzleCorrect] = useState(false)
  const [puzzleSelectedIdx, setPuzzleSelectedIdx] = useState(null)

  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const lastTickRef = useRef(null)

  function handleToggleMute() {
    const next = toggleMute()
    setMutedState(next)
  }

  // ── Load today's pack ──
  useEffect(() => {
    let cancelled = false

    async function loadPack() {
      try {
        const today = new Date().toISOString().split('T')[0]

        // Check if already played today
        const { data: existingSession } = await supabase
          .from('quiz_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('quiz_date', today)
          .limit(1)

        if (cancelled) return
        if (existingSession && existingSession.length > 0) {
          setErrorMsg('already_completed')
          setPhase('error')
          return
        }

        // Find today's pack
        const { data: todayPack, error: packError } = await supabase
          .from('daily_packs')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (cancelled) return
        if (packError || !todayPack) {
          // Fallback: try daily_quizzes for backward compatibility
          const { data: dailyQuiz, error: dqError } = await supabase
            .from('daily_quizzes')
            .select('id, question_1_id, question_2_id, question_3_id, question_4_id, question_5_id')
            .eq('quiz_date', today)
            .single()

          if (cancelled) return
          if (dqError || !dailyQuiz) {
            setErrorMsg('no_quiz')
            setPhase('error')
            return
          }

          // Legacy flow: use daily_quizzes
          setQuizId(dailyQuiz.id)
          const questionIds = [
            dailyQuiz.question_1_id,
            dailyQuiz.question_2_id,
            dailyQuiz.question_3_id,
            dailyQuiz.question_4_id,
            dailyQuiz.question_5_id,
          ].filter(Boolean)

          const { data: questionData } = await supabase
            .from('questions')
            .select('*')
            .in('id', questionIds)

          if (cancelled) return
          if (!questionData || questionData.length === 0) {
            setErrorMsg('load_failed')
            setPhase('error')
            return
          }

          const ordered = questionIds
            .map((id) => questionData.find((q) => q.id === id))
            .filter(Boolean)

          setQuestions(shuffleQuestionAnswers(ordered))
          setPhase('ready')
          return
        }

        // Pack-based flow
        setPack(todayPack)
        setQuizId(todayPack.id)

        const questionIds = todayPack.question_ids || []
        if (questionIds.length === 0) {
          setErrorMsg('load_failed')
          setPhase('error')
          return
        }

        // Load questions
        const { data: questionData } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds)

        if (cancelled) return
        if (!questionData || questionData.length === 0) {
          setErrorMsg('load_failed')
          setPhase('error')
          return
        }

        const ordered = questionIds
          .map((id) => questionData.find((q) => q.id === id))
          .filter(Boolean)

        setQuestions(shuffleQuestionAnswers(ordered))

        // Load puzzle if present
        if (todayPack.puzzle_id) {
          const { data: puzzleData } = await supabase
            .from('puzzles')
            .select('*')
            .eq('id', todayPack.puzzle_id)
            .single()
          if (!cancelled && puzzleData) setPuzzle(puzzleData)
        }

        // Load lesson if present
        if (todayPack.lesson_id) {
          const { data: lessonData } = await supabase
            .from('daily_lessons')
            .select('*')
            .eq('id', todayPack.lesson_id)
            .single()
          if (!cancelled && lessonData) setLesson(lessonData)
        }

        if (!cancelled) setPhase('ready')
      } catch (err) {
        if (err?.name !== 'AbortError') console.error('Pack load error:', err)
        if (!cancelled) {
          setErrorMsg('load_failed')
          setPhase('error')
        }
      }
    }

    if (user) loadPack()
    return () => { cancelled = true }
  }, [user])

  // Shuffle answer order so correct answer isn't always first
  function shuffleQuestionAnswers(ordered) {
    return ordered.map((q) => {
      const answersEn = q.answers_en || []
      const correctIdx = q.correct_answer_index // 1-based

      const indexed = answersEn.map((text, i) => ({ text, originalIndex: i + 1 }))

      // Fisher-Yates shuffle
      for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]]
      }

      const newCorrectIndex = indexed.findIndex((a) => a.originalIndex === correctIdx) + 1

      const shuffledEn = indexed.map((a) => a.text)
      const shuffledFr = q.answers_fr ? indexed.map((a) => q.answers_fr[a.originalIndex - 1]) : null
      const shuffledEs = q.answers_es ? indexed.map((a) => q.answers_es[a.originalIndex - 1]) : null
      const shuffledIt = q.answers_it ? indexed.map((a) => q.answers_it[a.originalIndex - 1]) : null

      return {
        ...q,
        answers_en: shuffledEn,
        answers_fr: shuffledFr,
        answers_es: shuffledEs,
        answers_it: shuffledIt,
        correct_answer_index: newCorrectIndex,
      }
    })
  }

  // Start the timer
  const startTimer = useCallback(() => {
    setTimeLeft(QUESTION_TIMER_SECONDS)
    startTimeRef.current = Date.now()
    lastTickRef.current = null

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const remaining = Math.max(QUESTION_TIMER_SECONDS - elapsed, 0)
      setTimeLeft(remaining)

      if (remaining <= TIMER_CRITICAL_SECONDS && remaining > 0 && remaining !== lastTickRef.current) {
        lastTickRef.current = remaining
        playTimerTick()
      }

      if (remaining === 5) {
        const currentLang = localStorage.getItem('akka_lang') || 'en'
        setTimerMessage({ text: `⏳ ${tRaw('hurry_up', currentLang)}`, type: 'warning' })
        setTimeout(() => setTimerMessage(null), 1500)
      } else if (remaining === 3) {
        const currentLang = localStorage.getItem('akka_lang') || 'en'
        setTimerMessage({ text: `🔥 ${tRaw('last_chance', currentLang)}`, type: 'critical' })
        setTimeout(() => setTimerMessage(null), 1500)
      }

      if (remaining <= 0) {
        clearInterval(timerRef.current)
        handleTimeUp()
      }
    }, 100)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function generateMemberStats(correctIndex) {
    const correctPct = Math.floor(Math.random() * 30) + 40
    let remaining = 100 - correctPct
    const others = []
    for (let i = 0; i < 2; i++) {
      const pct = Math.max(3, Math.floor(Math.random() * (remaining / 2)))
      others.push(pct)
      remaining -= pct
    }
    others.push(Math.max(3, remaining))
    others.sort(() => Math.random() - 0.5)

    const stats = []
    let otherIdx = 0
    for (let i = 0; i < 4; i++) {
      stats.push(i === correctIndex ? correctPct : others[otherIdx++])
    }
    return stats
  }

  function handleStart() {
    playTap()
    setPhase('question')
    startTimer()
  }

  function handleTimeUp() {
    if (phase !== 'question') return
    processAnswer(null, QUESTION_TIMER_SECONDS * 1000)
  }

  function handleAnswer(answerIndex) {
    if (selectedAnswer !== null) return
    clearInterval(timerRef.current)
    const elapsedMs = Date.now() - startTimeRef.current
    processAnswer(answerIndex, elapsedMs)
  }

  function processAnswer(answerIndex, elapsedMs) {
    const question = questions[currentIndex]
    const correct = answerIndex === question.correct_answer_index
    const clampedMs = Math.min(elapsedMs, QUESTION_TIMER_SECONDS * 1000)
    const elapsedSec = Math.round(clampedMs / 1000)

    let xpEarned = 0
    let speedBonus = 0
    if (correct) {
      xpEarned += XP_CORRECT_ANSWER
      if (elapsedSec <= SPEED_FAST_THRESHOLD) {
        speedBonus = XP_SPEED_BONUS_FAST
      } else if (elapsedSec <= SPEED_MEDIUM_THRESHOLD) {
        speedBonus = XP_SPEED_BONUS_MEDIUM
      }
      xpEarned += speedBonus
    }

    setSelectedAnswer(answerIndex)
    setIsCorrect(correct)
    setTimeSpentMs(clampedMs)

    if (correct) {
      playCorrect()
      const newCombo = combo + 1
      setCombo(newCombo)
      setMaxCombo(prev => Math.max(prev, newCombo))
      setShowEncouragement(getRandomEncouragement(lang))
      setTimeout(() => setShowEncouragement(null), 2000)
    } else {
      playWrong()
      setShakeAnswer(true)
      setTimeout(() => setShakeAnswer(false), 500)
      setCombo(0)
    }

    setMemberStats(generateMemberStats(question.correct_answer_index - 1))

    if (xpEarned > 0) {
      setXpFloat({ amount: xpEarned, speedBonus, key: Date.now() })
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionId: question.id,
        selectedIndex: answerIndex,
        correct,
        timeMs: clampedMs,
        xpEarned,
        speedBonus,
      },
    ])

    loadCommunityStats(question.id)
    setPhase('feedback')
  }

  async function loadCommunityStats(questionId) {
    try {
      const { data, error } = await supabase
        .from('quiz_answers')
        .select('selected_answer')
        .eq('question_id', questionId)

      if (error || !data || data.length === 0) {
        setCommunityStats(null)
        return
      }

      const total = data.length
      const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }
      data.forEach((a) => {
        if (counts[a.selected_answer] !== undefined) {
          counts[a.selected_answer]++
        }
      })

      setCommunityStats({
        total,
        1: Math.round((counts[1] / total) * 100),
        2: Math.round((counts[2] / total) * 100),
        3: Math.round((counts[3] / total) * 100),
        4: Math.round((counts[4] / total) * 100),
      })
    } catch {
      setCommunityStats(null)
    }
  }

  function handleNext() {
    playTap()
    setSelectedAnswer(null)
    setIsCorrect(null)
    setXpFloat(null)
    setCommunityStats(null)
    setShakeAnswer(false)
    setTimerMessage(null)
    setMemberStats(null)
    setShowEncouragement(null)

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1)
      setPhase('question')
      startTimer()
    } else {
      // Quiz done — go to puzzle or celebration or finish
      if (puzzle) {
        setPhase('puzzle')
      } else {
        finishQuiz()
      }
    }
  }

  // ── Puzzle handlers ──
  function puzzleGetLang(key) {
    if (!puzzle?.context_data) return ''
    return puzzle.context_data[`${key}_${lang}`] || puzzle.context_data[`${key}_en`] || ''
  }

  function puzzleGetList(key) {
    if (!puzzle?.context_data) return []
    return puzzle.context_data[`${key}_${lang}`] || puzzle.context_data[`${key}_en`] || []
  }

  function handlePuzzleSelect(idx, correctIdx) {
    if (puzzleAnswered) return
    setPuzzleSelectedIdx(idx)
    setPuzzleAnswered(true)
    setPuzzleCorrect(idx === correctIdx)

    if (user && puzzle) {
      supabase.from('puzzle_attempts').insert({
        user_id: user.id,
        puzzle_id: puzzle.id,
        is_correct: idx === correctIdx,
        response_time_ms: 0,
      }).then(() => {})
    }
  }

  function handlePuzzleDone() {
    setPhase('celebration')
  }

  function handleCelebrationDone() {
    if (lesson) {
      setPhase('lesson')
    } else {
      finishQuiz()
    }
  }

  function handleLessonDone() {
    finishQuiz()
  }

  // Lesson helpers
  function lessonGetLang(key) {
    if (!lesson) return ''
    return lesson[`${key}_${lang}`] || lesson[`${key}_en`] || ''
  }

  async function finishQuiz() {
    const score = answers.filter((a) => a.correct).length
    const isPerfect = score === questions.length
    const totalSpeedBonuses = answers.filter((a) => a.speedBonus > 0).length
    const totalXP =
      XP_QUIZ_STARTED +
      answers.reduce((sum, a) => sum + a.xpEarned, 0) +
      (isPerfect ? XP_PERFECT_QUIZ : 0) +
      (puzzleCorrect ? 25 : 0) // bonus XP for puzzle
    const totalDurationSec = Math.round(
      answers.reduce((sum, a) => sum + a.timeMs, 0) / 1000
    )
    const avgTime =
      answers.length > 0 ? Math.round(totalDurationSec / answers.length) : 0

    const today = new Date().toISOString().split('T')[0]
    const sessionLang = localStorage.getItem('akka_lang') || 'en'

    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('total_xp, current_streak, longest_streak, last_quiz_date, total_quizzes, total_correct, total_questions')
        .eq('id', user.id)
        .single()

      let newStreak = 1
      if (currentProfile) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        if (currentProfile.last_quiz_date === yesterdayStr) {
          newStreak = (currentProfile.current_streak || 0) + 1
        } else if (currentProfile.last_quiz_date === today) {
          newStreak = currentProfile.current_streak || 1
        }
      }

      const { data: session, error: sError } = await supabase
        .from('quiz_sessions')
        .insert({
          user_id: user.id,
          daily_quiz_id: quizId,
          quiz_date: today,
          score,
          total_xp_earned: totalXP,
          duration_seconds: totalDurationSec,
          speed_bonuses: totalSpeedBonuses,
          is_perfect: isPerfect,
          streak_day: newStreak,
          streak_multiplier: 1.0,
          language: sessionLang,
        })
        .select('id')
        .single()

      if (sError) console.error('Session save error:', sError)

      if (session) {
        const answerRows = answers.map((a, idx) => ({
          session_id: session.id,
          question_id: a.questionId,
          question_order: idx + 1,
          selected_answer: a.selectedIndex ?? 1,
          is_correct: a.correct,
          response_time_ms: Math.round(a.timeMs),
          speed_bonus: a.speedBonus,
          xp_earned: a.xpEarned,
        }))

        const { error: aError } = await supabase.from('quiz_answers').insert(answerRows)
        if (aError) console.error('Answers save error:', aError)
      }

      if (currentProfile) {
        const newLongest = Math.max(currentProfile.longest_streak || 0, newStreak)

        await supabase
          .from('profiles')
          .update({
            total_xp: (currentProfile.total_xp || 0) + totalXP,
            current_streak: newStreak,
            longest_streak: newLongest,
            last_quiz_date: today,
            total_quizzes: (currentProfile.total_quizzes || 0) + 1,
            total_correct: (currentProfile.total_correct || 0) + score,
            total_questions: (currentProfile.total_questions || 0) + questions.length,
          })
          .eq('id', user.id)
      }
    } catch (err) {
      console.error('Quiz finish error:', err)
    }

    navigate('/quiz/results', {
      state: {
        score,
        totalQuestions: questions.length,
        answers,
        totalXP,
        avgTime,
        quizId,
        maxCombo,
      },
      replace: true,
    })
  }

  // --- RENDER ---

  const question = questions[currentIndex]
  const questionText = question ? (question[`question_${lang}`] || question.question_en) : ''
  const answersArr = question ? (question[`answers_${lang}`] || question.answers_en || []) : []
  const explanation = question ? (question[`explanation_${lang}`] || question.explanation_en) : ''

  const timerProgress = timeLeft / QUESTION_TIMER_SECONDS
  const timerPercent = (timeLeft / QUESTION_TIMER_SECONDS) * 100
  const timerColor =
    timerPercent > 50 ? 'text-[#3498DB]' : timerPercent > 25 ? 'text-[#F39C12]' : 'text-[#E74C3C]'
  const timerBarColor =
    timerPercent > 50 ? 'bg-[#3498DB]' : timerPercent > 25 ? 'bg-[#F39C12]' : 'bg-[#E74C3C] animate-pulse'
  const timerBg =
    timerPercent > 50 ? 'bg-blue-50' : timerPercent > 25 ? 'bg-amber-50' : 'bg-red-50'
  const isCritical = timeLeft <= TIMER_CRITICAL_SECONDS && timeLeft > 0 && phase === 'question'
  const timeSpentSec = Math.round(timeSpentMs / 1000)

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-akka-bg flex flex-col items-center justify-center">
        <Loader2 size={32} className="text-akka-green animate-spin mb-4" />
        <p className="text-akka-text-secondary">{t('loading_quiz')}</p>
      </div>
    )
  }

  // Already completed
  if (phase === 'error' && errorMsg === 'already_completed') {
    return (
      <div className="min-h-screen bg-akka-bg flex flex-col">
        <QuizHeader onBack={() => navigate('/')} muted={muted} onToggleMute={handleToggleMute} title={t('quiz_of_the_day')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-akka-green" />
          </div>
          <h2 className="text-xl font-bold text-akka-text mb-2">{t('quiz_completed')}</h2>
          <p className="text-akka-text-secondary text-center text-sm mb-6">
            {t('come_back_tomorrow')}
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            {t('back_home')}
          </Button>
        </div>
      </div>
    )
  }

  // Generic error
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-akka-bg flex flex-col">
        <QuizHeader onBack={() => navigate('/')} muted={muted} onToggleMute={handleToggleMute} title={t('quiz_of_the_day')} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-amber-500" />
          </div>
          <p className="text-akka-text text-center font-semibold mb-2">{t('no_quiz_title')}</p>
          <p className="text-akka-text-secondary text-center text-sm mb-6">
            {errorMsg === 'no_quiz' ? t('no_quiz_available') : t('something_went_wrong')}
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            {t('back_home')}
          </Button>
        </div>
      </div>
    )
  }

  // Ready state
  if (phase === 'ready') {
    const streak = profile?.current_streak || 0
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1B3D2F] via-[#1B3D2F] to-[#0B1A14] flex flex-col">
        <QuizHeader onBack={() => navigate('/')} muted={muted} onToggleMute={handleToggleMute} title={t('quiz_of_the_day')} dark />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-[#2ECC71] opacity-20 blur-2xl scale-150" />
            <div className="relative w-24 h-24 rounded-3xl bg-[#2ECC71]/15 flex items-center justify-center border border-[#2ECC71]/20">
              <span className="text-5xl drop-shadow-lg">🧠</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('quiz_of_the_day')}</h2>
          <p className="text-[#A7C4B8] text-center mb-1">
            {tp('questions_per_question', { count: questions.length, timer: QUESTION_TIMER_SECONDS })}
          </p>
          {pack && (
            <p className="text-xs text-[#A7C4B8]/70 mb-1">
              {pack.theme && `📚 ${pack.theme}`}
              {puzzle && ' · 🧩 Puzzle'}
              {lesson && ' · 📖 Lesson'}
            </p>
          )}
          <p className="text-xs text-[#A7C4B8] mb-4">
            {t('answer_quickly')}
          </p>
          {streak > 0 && (
            <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/20">
              <span className="text-lg">🔥</span>
              <span className="text-sm font-bold text-[#2ECC71]">{streak} {t('days')}</span>
            </div>
          )}
          {!streak && <div className="mb-6" />}
          <button
            onClick={handleStart}
            className="relative w-full max-w-xs py-4 rounded-2xl bg-[#2ECC71] text-white font-bold text-lg shadow-lg shadow-[#2ECC71]/30 active:scale-[0.97] transition-transform overflow-hidden"
          >
            <span className="relative z-10">{t('start_quiz_short')}</span>
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </button>
        </div>
      </div>
    )
  }

  // ── PUZZLE PHASE ──
  if (phase === 'puzzle' && puzzle) {
    const c = puzzle.context_data || {}
    const type = puzzle.interaction_type

    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => handlePuzzleDone()} className="p-2 -ml-2">
            <ArrowLeft size={20} className="text-[#6B7280]" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wider text-purple-600 font-bold">The Catch</p>
            <p className="text-[10px] text-[#6B7280]">{puzzle.theme}</p>
          </div>
        </div>
        <div className="flex-1 px-4 py-4">
          {renderPuzzleContent(type, c)}
        </div>
        {puzzleAnswered && (
          <div className="px-4 py-4">
            <div className={`p-3 rounded-xl mb-3 ${puzzleCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                {puzzleCorrect ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                <p className={`text-sm font-bold ${puzzleCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {puzzleCorrect ? 'Correct!' : 'Not quite!'}
                </p>
              </div>
              <p className="text-xs text-gray-700">
                {puzzle.context_data?.[`explanation_${lang}`]
                  || puzzle.context_data?.explanation_en
                  || puzzle[`explanation_${lang}`]
                  || puzzle.explanation || ''}
              </p>
            </div>
            <button
              onClick={handlePuzzleDone}
              className="w-full py-3.5 bg-[#1B3D2F] text-white font-bold rounded-xl text-sm"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── CELEBRATION PHASE ──
  if (phase === 'celebration') {
    const score = answers.filter((a) => a.correct).length
    const totalXP = XP_QUIZ_STARTED +
      answers.reduce((sum, a) => sum + a.xpEarned, 0) +
      (score === questions.length ? XP_PERFECT_QUIZ : 0) +
      (puzzleCorrect ? 25 : 0)

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1B3D2F] to-[#2D5A45] flex flex-col items-center justify-center px-6 text-white">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Challenge Complete!</h2>
        <p className="text-white/70 mb-2">
          Quiz: {score}/{questions.length} correct
          {puzzleAnswered && ` · Puzzle: ${puzzleCorrect ? '✅' : '❌'}`}
        </p>
        <p className="text-5xl font-black my-4">
          +{totalXP} XP
        </p>
        <p className="text-sm text-white/60 mb-8">Keep learning to build your investor skills!</p>
        <button
          onClick={handleCelebrationDone}
          className="px-8 py-3.5 bg-white text-[#1B3D2F] font-bold rounded-xl"
        >
          {lesson ? "Today's Lesson →" : 'See Results'}
        </button>
      </div>
    )
  }

  // ── LESSON PHASE ──
  if (phase === 'lesson' && lesson) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={handleLessonDone} className="p-2 -ml-2">
            <ArrowLeft size={20} className="text-[#6B7280]" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wider text-amber-600 font-bold">
              Lesson of the Day
            </p>
            <p className="text-[10px] text-[#6B7280]">{lesson.theme}</p>
          </div>
        </div>

        <div className="flex-1 px-4 py-4">
          <h1 className="text-xl font-bold text-[#1A1A1A] mb-4">{lessonGetLang('title')}</h1>

          <div className="w-full aspect-video bg-gradient-to-br from-[#1B3D2F] to-[#2D5A45] rounded-2xl flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <Play size={28} className="text-white ml-1" />
            </div>
            <p className="text-white/70 text-xs">Video coming soon</p>
          </div>

          <div className="space-y-3">
            {lessonGetLang('content')
              .split('\n')
              .filter(Boolean)
              .map((p, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">
                  {p}
                </p>
              ))}
          </div>

          {lessonGetLang('key_takeaway') && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-amber-600" />
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Key Takeaway
                </p>
              </div>
              <p className="text-sm text-amber-900 font-medium leading-relaxed">
                {lessonGetLang('key_takeaway')}
              </p>
            </div>
          )}
        </div>

        <div className="px-4 py-4">
          <button
            onClick={handleLessonDone}
            className="w-full py-3.5 bg-[#1B3D2F] text-white font-bold rounded-xl text-sm"
          >
            Done — See Results
          </button>
        </div>
      </div>
    )
  }

  // ── Puzzle content renderer ──
  function renderPuzzleContent(type, data) {
    // data = puzzle.context_data
    // Correct answer index from puzzle.answer (string like "0", "1", "2")
    const correctIdx = parseInt(puzzle?.answer, 10) || 0
    const options = puzzleGetList('options')

    if (type === 'tap_to_spot') {
      return (
        <>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Spot the Error</h2>
          <p className="text-sm text-[#6B7280] mb-4">Tap the part that's wrong:</p>
          <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-800 leading-relaxed mb-4">
            {puzzleGetLang('statement')}
          </div>
          {!puzzleAnswered ? (
            <button
              onClick={() => handlePuzzleSelect(0, 0)}
              className="w-full py-3 border-2 border-purple-300 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-50"
            >
              I found the error!
            </button>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-xs text-red-600 font-medium">Error: {puzzleGetLang('error_part')}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600 font-medium">Correct: {puzzleGetLang('correction')}</p>
              </div>
            </div>
          )}
        </>
      )
    }

    if (type === 'ab_choice') {
      // For ab_choice, correctIdx from puzzle.answer (0 or 1)
      const correctOpt = correctIdx
      return (
        <>
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">A/B Choice</h2>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">{puzzleGetLang('scenario')}</p>
          <div className="space-y-3">
            {['option_a', 'option_b'].map((key, idx) => {
              let style = 'border-gray-200 bg-white'
              if (puzzleAnswered) {
                if (idx === correctOpt) style = 'border-green-500 bg-green-50'
                else if (idx === puzzleSelectedIdx) style = 'border-red-500 bg-red-50'
                else style = 'border-gray-100 bg-gray-50'
              }
              return (
                <button
                  key={idx}
                  onClick={() => handlePuzzleSelect(idx, correctOpt)}
                  disabled={puzzleAnswered}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium ${style}`}
                >
                  <span className="font-bold mr-2">{idx === 0 ? 'A' : 'B'}.</span>
                  {puzzleGetLang(key)}
                </button>
              )
            })}
          </div>
        </>
      )
    }

    // Generic options-based puzzles (fill_gap, match_chart, before_after, crash_point)
    const titles = {
      fill_gap: 'Fill the Gap',
      match_chart: 'Match the Chart',
      before_after: 'Before & After',
      crash_point: 'Crash Point',
    }

    return (
      <>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">{titles[type] || type}</h2>

        {type === 'fill_gap' && (
          <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-800 leading-relaxed mb-4">
            {puzzleGetLang('statement')}
          </div>
        )}

        {type === 'match_chart' && (
          <>
            <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-800 mb-4">
              📈 {puzzleGetLang('chart_description')}
            </div>
            <p className="text-sm text-[#6B7280] mb-3">What does this chart represent?</p>
          </>
        )}

        {type === 'before_after' && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] uppercase text-[#6B7280] font-bold mb-1">Before</p>
                <p className="text-sm text-gray-800">{puzzleGetLang('before')}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <p className="text-[10px] uppercase text-amber-600 font-bold mb-1">After</p>
                <p className="text-sm text-gray-800">{puzzleGetLang('after')}</p>
              </div>
            </div>
            <p className="text-sm font-medium text-[#1A1A1A] mb-3">{puzzleGetLang('question')}</p>
          </>
        )}

        {type === 'crash_point' && (
          <>
            <div className="p-4 bg-red-50 rounded-xl text-sm text-red-800 mb-4">
              💥 {puzzleGetLang('timeline')}
            </div>
            <p className="text-sm font-medium text-[#1A1A1A] mb-3">{puzzleGetLang('question')}</p>
          </>
        )}

        <div className="space-y-2">
          {options.map((opt, idx) => {
            let style = 'border-gray-200 bg-white'
            if (puzzleAnswered) {
              if (idx === correctIdx) style = 'border-green-500 bg-green-50'
              else if (idx === puzzleSelectedIdx) style = 'border-red-500 bg-red-50'
              else style = 'border-gray-100 bg-gray-50'
            }
            return (
              <button
                key={idx}
                onClick={() => handlePuzzleSelect(idx, correctIdx)}
                disabled={puzzleAnswered}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium ${style}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </>
    )
  }

  // ── Question + Feedback states (quiz phase) ──
  return (
    <div className="min-h-screen bg-akka-bg flex flex-col pb-24">
      {/* Header with progress + mute */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-akka-border">
        <button
          onClick={() => navigate('/')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        {/* Segmented progress bar */}
        <div className="flex-1 flex items-center gap-1">
          {questions.map((_, i) => {
            const answered = answers[i]
            let segColor = 'bg-gray-200'
            if (i < currentIndex && answered) {
              segColor = answered.correct ? 'bg-akka-green' : 'bg-akka-red'
            } else if (i === currentIndex) {
              segColor = phase === 'feedback'
                ? isCorrect ? 'bg-akka-green' : 'bg-akka-red'
                : 'bg-akka-dark'
            }
            return (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${segColor} ${
                  i === currentIndex && phase === 'question' ? 'animate-progress-pulse' : ''
                }`}
              />
            )
          })}
          {/* Puzzle indicator */}
          {puzzle && (
            <div className={`h-2 w-6 rounded-full transition-all duration-300 ${
              phase === 'puzzle' ? 'bg-purple-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
        {/* Timer badge */}
        <div
          className={`min-w-[52px] h-9 rounded-full flex items-center justify-center gap-1 px-2.5 ${timerBg} ${
            isCritical ? 'animate-timer-pulse' : ''
          }`}
        >
          <Clock size={14} className={timerColor} />
          <span className={`text-sm font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
        </div>
        {/* Mute toggle */}
        <button
          onClick={handleToggleMute}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
        >
          {muted ? <VolumeX size={18} className="text-gray-400" /> : <Volume2 size={18} className="text-akka-text-secondary" />}
        </button>
      </div>

      {/* Timer progress bar */}
      {phase === 'question' && (
        <div className="w-full h-2 bg-gray-100">
          <div
            className={`h-full rounded-r-full transition-all duration-200 ease-linear ${timerBarColor}`}
            style={{ width: `${timerProgress * 100}%` }}
          />
        </div>
      )}

      {/* Speech Bubble Encouragement */}
      {showEncouragement && (
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="animate-speech-bubble bg-[#1B3D2F] text-white font-bold text-lg px-6 py-3 rounded-2xl shadow-lg relative">
            {showEncouragement}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1B3D2F] rotate-45" />
          </div>
        </div>
      )}

      {/* Combo Counter */}
      {combo >= 2 && (
        <div className="animate-combo animate-glow text-center py-1">
          <span className="text-2xl font-black text-[#1B3D2F]">
            {combo}x {getQuizText('combo', lang)}
          </span>
        </div>
      )}

      {/* Timer pressure messages */}
      {timerMessage && (
        <div className={`mx-4 mt-2 px-4 py-2.5 rounded-xl text-white text-center text-sm font-bold animate-bounce ${
          timerMessage.type === 'critical' ? 'bg-[#E74C3C]' : 'bg-[#F39C12]'
        }`}>
          {timerMessage.text}
        </div>
      )}

      {/* Question counter */}
      <div className="px-4 pt-4">
        <p className="text-xs font-semibold text-akka-text-secondary uppercase tracking-wide">
          {tp('question_of', { n: currentIndex + 1, total: questions.length })}
        </p>
      </div>

      {/* Question text */}
      <div key={currentIndex} className="px-4 pt-3 pb-4 animate-slide-in">
        <h2 className="text-lg font-bold text-akka-text leading-snug">
          {questionText}
        </h2>
      </div>

      {/* Answer cards */}
      <div className="px-4 flex-1 flex flex-col gap-2.5">
        {answersArr.map((answerText, idx) => {
          const num = idx + 1
          const isSelected = selectedAnswer === num
          const isCorrectAnswer = question.correct_answer_index === num
          const showResult = phase === 'feedback'

          let cardStyle = 'bg-white border-akka-border'
          let textColor = 'text-akka-text'
          let fontWeight = 'font-medium'
          if (showResult) {
            if (isCorrectAnswer) {
              cardStyle = 'bg-[#ECFDF5] border-[#2ECC71] border-[3px]'
              textColor = 'text-[#166534]'
              fontWeight = 'font-bold'
            } else if (isSelected && !isCorrect) {
              cardStyle = 'bg-[#FEF2F2] border-[#E74C3C] border-[3px]'
              textColor = 'text-[#991B1B]'
              fontWeight = 'font-bold'
            } else {
              cardStyle = 'bg-gray-50 border-gray-200 opacity-40'
              textColor = 'text-gray-400'
            }
          } else if (isSelected) {
            cardStyle = 'bg-akka-dark border-akka-dark'
            textColor = 'text-white'
          }

          const shouldShake = showResult && isSelected && !isCorrect && shakeAnswer
          const shouldPulse = showResult && isSelected && isCorrect
          const communityPct = communityStats ? communityStats[num] : null

          return (
            <button
              key={num}
              onClick={() => phase === 'question' && handleAnswer(num)}
              disabled={phase === 'feedback'}
              className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] animate-fadeInUp ${cardStyle} ${
                shouldShake ? 'animate-shake' : shouldPulse ? 'animate-pulse-select' : ''
              }`}
              style={{ animationDelay: `${idx * 0.07}s` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    showResult && isCorrectAnswer
                      ? 'bg-[#2ECC71] text-white'
                      : showResult && isSelected && !isCorrect
                        ? 'bg-[#E74C3C] text-white'
                        : isSelected && !showResult
                          ? 'bg-white text-akka-dark'
                          : 'bg-gray-100 text-akka-text-secondary'
                  }`}
                >
                  {showResult && isCorrectAnswer ? (
                    <CheckCircle size={16} />
                  ) : showResult && isSelected && !isCorrect ? (
                    <XCircle size={16} />
                  ) : (
                    String.fromCharCode(64 + num)
                  )}
                </div>
                <span className={`text-sm flex-1 ${textColor} ${fontWeight}`}>
                  {answerText}
                </span>
              </div>

              {showResult && communityPct !== null && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCorrectAnswer ? 'bg-akka-green' : 'bg-gray-300'
                      }`}
                      style={{ width: `${communityPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-akka-text-secondary w-8 text-right">
                    {communityPct}%
                  </span>
                </div>
              )}
            </button>
          )
        })}

        {/* How Akka members answered */}
        {phase === 'feedback' && !communityStats && memberStats && (
          <div className="mt-5 px-1">
            <p className="text-xs font-semibold text-akka-text-secondary uppercase tracking-wide mb-3">{getQuizText('membersAnswered', lang)}</p>
            <div className="space-y-2">
              {answersArr.map((ansText, i) => {
                const pct = memberStats[i]
                const isCorrectIdx = i === question.correct_answer_index - 1
                const isSelectedIdx = i === selectedAnswer - 1
                const barColor = isCorrectIdx ? 'bg-[#1B3D2F]' : isSelectedIdx ? 'bg-[#E74C3C]' : 'bg-[#E5E7EB]'
                const textColor = isCorrectIdx || isSelectedIdx ? 'text-white' : 'text-akka-text'
                const letter = String.fromCharCode(65 + i)
                return (
                  <div key={i} className="relative h-10 rounded-xl overflow-hidden bg-gray-100">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-xl ${barColor} transition-all duration-700 ease-out`}
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    />
                    <div className="relative h-full flex items-center px-3 gap-2">
                      <span className={`text-xs font-bold ${textColor} w-5 shrink-0`}>{letter}</span>
                      <span className={`text-xs font-medium ${textColor} flex-1 truncate`}>{ansText}</span>
                      <span className={`text-xs font-bold ${textColor} shrink-0`}>{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Feedback section */}
      {phase === 'feedback' && (
        <div className="px-4 pt-4 pb-6">
          {xpFloat && (
            <div key={xpFloat.key} className="flex justify-center mb-3 animate-float-up">
              <span className="text-[#1B3D2F] font-black text-xl">
                +{xpFloat.amount} XP
                {xpFloat.speedBonus > 0 && (
                  <span className="text-sm font-bold text-[#F39C12] ml-1.5">⚡ Speed!</span>
                )}
              </span>
            </div>
          )}

          <div
            className={`mb-4 p-4 rounded-2xl border border-l-4 ${
              isCorrect
                ? 'bg-[#F0FDF4] border-[#BBF7D0] border-l-[#2ECC71]'
                : 'bg-[#FEF2F2] border-[#FECACA] border-l-[#E74C3C]'
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle size={18} className="text-[#2ECC71] shrink-0 mt-0.5" />
              ) : (
                <XCircle size={18} className="text-[#E74C3C] shrink-0 mt-0.5" />
              )}
              <p className={`text-sm font-bold ${isCorrect ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
                {isCorrect ? t('correct') : getQuizText('wrongAnswer', lang)}
              </p>
            </div>
            <p className="text-sm text-[#1A1A1A] leading-relaxed font-medium">
              {explanation}
            </p>
            <p className={`text-xs mt-2 font-semibold ${isCorrect ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
              {tp('answered_in', { time: timeSpentSec })}
              {answers[answers.length - 1]?.speedBonus > 0 && ` · ⚡ ${t('speed_bonus')}`}
            </p>
          </div>

          <Button variant="primary" className="w-full gap-2" onClick={handleNext}>
            {currentIndex + 1 < questions.length ? (
              <>
                {t('next_question')}
                <ChevronRight size={18} />
              </>
            ) : puzzle ? (
              'Continue to Puzzle →'
            ) : (
              t('see_results')
            )}
          </Button>
        </div>
      )}

      <TabBar />
    </div>
  )
}

/**
 * QuizHeader — back button + title + optional mute toggle.
 */
function QuizHeader({ onBack, muted, onToggleMute, title, dark }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? 'border-white/10' : 'border-akka-border'}`}>
      <button
        onClick={onBack}
        className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
      >
        <ArrowLeft size={20} className={dark ? 'text-white' : ''} />
      </button>
      <h1 className={`text-lg font-bold ${dark ? 'text-white' : 'text-akka-text'}`}>{title}</h1>
      <button
        onClick={onToggleMute}
        className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}
      >
        {muted ? <VolumeX size={18} className={dark ? 'text-white/40' : 'text-gray-400'} /> : <Volume2 size={18} className={dark ? 'text-white/60' : 'text-akka-text-secondary'} />}
      </button>
    </div>
  )
}
