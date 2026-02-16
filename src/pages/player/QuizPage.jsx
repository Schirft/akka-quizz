import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'
import {
  QUESTION_TIMER_SECONDS,
  TIMER_WARNING_SECONDS,
  TIMER_CRITICAL_SECONDS,
  XP_CORRECT_ANSWER,
  XP_SPEED_BONUS_FAST,
  XP_SPEED_BONUS_MEDIUM,
  XP_QUIZ_STARTED,
  XP_PERFECT_QUIZ,
  SPEED_FAST_THRESHOLD,
  SPEED_MEDIUM_THRESHOLD,
  QUESTIONS_PER_QUIZ,
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
import Card from '../../components/ui/Card'
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
} from 'lucide-react'

/**
 * QuizPage — the full quiz experience with timer, feedback, sounds, and transitions.
 *
 * Schema notes:
 * - daily_quizzes: question_1_id..question_5_id (individual FK columns)
 * - questions.answers_en: jsonb array ["A","B","C","D"], correct_answer_index 1-4
 * - quiz_sessions: total_xp_earned, duration_seconds, speed_bonuses, is_perfect
 * - quiz_answers: question_order, response_time_ms, speed_bonus (no user_id)
 * - profiles: current_streak, total_quizzes, total_correct, total_questions
 */
export default function QuizPage() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()

  // Quiz state
  const [quizState, setQuizState] = useState('loading') // loading | ready | question | feedback | error
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

  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const lastTickRef = useRef(null) // track last tick sound to avoid repeats

  // Handle mute toggle
  function handleToggleMute() {
    const next = toggleMute()
    setMutedState(next)
  }

  // Load daily quiz
  useEffect(() => {
    async function loadQuiz() {
      try {
        const today = new Date().toISOString().split('T')[0]

        // Check if already played today
        const { data: existingSession } = await supabase
          .from('quiz_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('quiz_date', today)
          .limit(1)

        if (existingSession && existingSession.length > 0) {
          setErrorMsg('You have already completed today\'s quiz!')
          setQuizState('error')
          return
        }

        // Find today's daily quiz
        const { data: dailyQuiz, error: dqError } = await supabase
          .from('daily_quizzes')
          .select('id, question_1_id, question_2_id, question_3_id, question_4_id, question_5_id')
          .eq('quiz_date', today)
          .single()

        if (dqError || !dailyQuiz) {
          setErrorMsg('No quiz available for today. Try seeding a test quiz from the home page.')
          setQuizState('error')
          return
        }

        setQuizId(dailyQuiz.id)

        const questionIds = [
          dailyQuiz.question_1_id,
          dailyQuiz.question_2_id,
          dailyQuiz.question_3_id,
          dailyQuiz.question_4_id,
          dailyQuiz.question_5_id,
        ].filter(Boolean)

        const { data: questionData, error: qError } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds)

        if (qError || !questionData || questionData.length === 0) {
          setErrorMsg('Could not load quiz questions.')
          setQuizState('error')
          return
        }

        const ordered = questionIds
          .map((id) => questionData.find((q) => q.id === id))
          .filter(Boolean)

        // Shuffle answer order so correct answer isn't always first
        const shuffledQuestions = ordered.map((q) => {
          const answers = q.answers_en || []
          const correctIdx = q.correct_answer_index // 1-based

          // Create indexed array: [{text, originalIndex}]
          const indexed = answers.map((text, i) => ({ text, originalIndex: i + 1 }))

          // Fisher-Yates shuffle
          for (let i = indexed.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indexed[i], indexed[j]] = [indexed[j], indexed[i]]
          }

          // Find new position of correct answer (1-based)
          const newCorrectIndex = indexed.findIndex((a) => a.originalIndex === correctIdx) + 1

          // Build shuffled answers for each language
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

        setQuestions(shuffledQuestions)
        setQuizState('ready')
      } catch (err) {
        console.error('Quiz load error:', err)
        setErrorMsg('Something went wrong loading the quiz.')
        setQuizState('error')
      }
    }

    if (user) loadQuiz()
  }, [user])

  // Start the timer
  const startTimer = useCallback(() => {
    setTimeLeft(QUESTION_TIMER_SECONDS)
    startTimeRef.current = Date.now()
    lastTickRef.current = null

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const remaining = Math.max(QUESTION_TIMER_SECONDS - elapsed, 0)
      setTimeLeft(remaining)

      // Play tick sound at critical threshold
      if (remaining <= TIMER_CRITICAL_SECONDS && remaining > 0 && remaining !== lastTickRef.current) {
        lastTickRef.current = remaining
        playTimerTick()
      }

      if (remaining <= 0) {
        clearInterval(timerRef.current)
        handleTimeUp()
      }
    }, 100)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  function handleStart() {
    playTap()
    setQuizState('question')
    startTimer()
  }

  function handleTimeUp() {
    if (quizState !== 'question') return
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

    // Sound effects
    if (correct) {
      playCorrect()
    } else {
      playWrong()
      setShakeAnswer(true)
      setTimeout(() => setShakeAnswer(false), 500)
    }

    if (xpEarned > 0) {
      setXpFloat({ amount: xpEarned, key: Date.now() })
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
    setQuizState('feedback')
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

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1)
      setQuizState('question')
      startTimer()
    } else {
      finishQuiz()
    }
  }

  async function finishQuiz() {
    const score = answers.filter((a) => a.correct).length
    const isPerfect = score === QUESTIONS_PER_QUIZ
    const totalSpeedBonuses = answers.filter((a) => a.speedBonus > 0).length
    const totalXP =
      XP_QUIZ_STARTED +
      answers.reduce((sum, a) => sum + a.xpEarned, 0) +
      (isPerfect ? XP_PERFECT_QUIZ : 0)
    const totalDurationSec = Math.round(
      answers.reduce((sum, a) => sum + a.timeMs, 0) / 1000
    )
    const avgTime =
      answers.length > 0 ? Math.round(totalDurationSec / answers.length) : 0

    const today = new Date().toISOString().split('T')[0]

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
          language: profile?.language || localStorage.getItem('akka_lang') || 'en',
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
      },
      replace: true,
    })
  }

  // --- RENDER ---

  const question = questions[currentIndex]
  const lang = profile?.language || localStorage.getItem('akka_lang') || 'en'

  const answersArr = question ? (question[`answers_${lang}`] || question.answers_en || []) : []

  // Timer progress (0 → 1)
  const timerProgress = timeLeft / QUESTION_TIMER_SECONDS

  // Timer colors
  const timerColor =
    timeLeft <= TIMER_CRITICAL_SECONDS
      ? 'text-akka-red'
      : timeLeft <= TIMER_WARNING_SECONDS
        ? 'text-amber-500'
        : 'text-akka-green'

  const timerBarColor =
    timeLeft <= TIMER_CRITICAL_SECONDS
      ? 'bg-akka-red'
      : timeLeft <= TIMER_WARNING_SECONDS
        ? 'bg-amber-500'
        : 'bg-akka-green'

  const timerBg =
    timeLeft <= TIMER_CRITICAL_SECONDS
      ? 'bg-red-50'
      : timeLeft <= TIMER_WARNING_SECONDS
        ? 'bg-amber-50'
        : 'bg-emerald-50'

  const isCritical = timeLeft <= TIMER_CRITICAL_SECONDS && timeLeft > 0 && quizState === 'question'

  const timeSpentSec = Math.round(timeSpentMs / 1000)

  // Loading state
  if (quizState === 'loading') {
    return (
      <div className="min-h-screen bg-akka-bg flex flex-col items-center justify-center">
        <Loader2 size={32} className="text-akka-green animate-spin mb-4" />
        <p className="text-akka-text-secondary">Loading quiz...</p>
      </div>
    )
  }

  // Already completed state — friendly screen instead of error
  if (quizState === 'error' && errorMsg.includes('already completed')) {
    return (
      <div className="min-h-screen bg-akka-bg flex flex-col">
        <QuizHeader onBack={() => navigate('/')} muted={muted} onToggleMute={handleToggleMute} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-akka-green" />
          </div>
          <h2 className="text-xl font-bold text-akka-text mb-2">Quiz Completed!</h2>
          <p className="text-akka-text-secondary text-center text-sm mb-6">
            You've already completed today's quiz. Come back tomorrow for new questions!
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // Generic error state
  if (quizState === 'error') {
    return (
      <div className="min-h-screen bg-akka-bg flex flex-col">
        <QuizHeader onBack={() => navigate('/')} muted={muted} onToggleMute={handleToggleMute} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-amber-500" />
          </div>
          <p className="text-akka-text text-center font-semibold mb-2">No Quiz Available</p>
          <p className="text-akka-text-secondary text-center text-sm mb-6">{errorMsg}</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  // Ready state
  if (quizState === 'ready') {
    return (
      <div className="min-h-screen bg-akka-bg flex flex-col">
        <QuizHeader onBack={() => navigate('/')} muted={muted} onToggleMute={handleToggleMute} />
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6">
            <span className="text-4xl">🧠</span>
          </div>
          <h2 className="text-2xl font-bold text-akka-text mb-2">Quiz of the Day</h2>
          <p className="text-akka-text-secondary text-center mb-1">
            {questions.length} questions · {QUESTION_TIMER_SECONDS}s per question
          </p>
          <p className="text-xs text-akka-text-secondary mb-8">
            Answer quickly for speed bonus XP!
          </p>
          <Button variant="primary" className="w-full max-w-xs gap-2" onClick={handleStart}>
            Start Quiz
          </Button>
        </div>
      </div>
    )
  }

  // Question + Feedback states
  return (
    <div className="min-h-screen bg-akka-bg flex flex-col">
      {/* Header with progress + mute */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-akka-border">
        <button
          onClick={() => navigate('/')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        {/* Progress dots */}
        <div className="flex-1 flex items-center gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentIndex
                  ? 'bg-akka-green'
                  : i === currentIndex
                    ? quizState === 'feedback'
                      ? isCorrect
                        ? 'bg-akka-green'
                        : 'bg-akka-red'
                      : 'bg-akka-dark'
                    : 'bg-gray-200'
              }`}
            />
          ))}
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
      {quizState === 'question' && (
        <div className="w-full h-2 bg-gray-100">
          <div
            className={`h-full rounded-r-full transition-all duration-200 ease-linear ${timerBarColor}`}
            style={{ width: `${timerProgress * 100}%` }}
          />
        </div>
      )}

      {/* Timer pressure messages */}
      {quizState === 'question' && timeLeft <= TIMER_WARNING_SECONDS && timeLeft > TIMER_CRITICAL_SECONDS && (
        <div className="mx-4 mt-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-center">
          <span className="text-xs font-bold text-amber-600">⏳ Hurry up!</span>
        </div>
      )}
      {quizState === 'question' && timeLeft <= TIMER_CRITICAL_SECONDS && timeLeft > 0 && (
        <div className="mx-4 mt-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-center animate-timer-pulse">
          <span className="text-xs font-bold text-red-600">🔥 Last chance!</span>
        </div>
      )}

      {/* Question counter */}
      <div className="px-4 pt-4">
        <p className="text-xs font-semibold text-akka-text-secondary uppercase tracking-wide">
          Question {currentIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Question text */}
      <div className="px-4 pt-3 pb-4">
        <h2 className="text-lg font-bold text-akka-text leading-snug">
          {question[`question_${lang}`] || question.question_en}
        </h2>
      </div>

      {/* Answer cards */}
      <div className="px-4 flex-1 flex flex-col gap-2.5">
        {answersArr.map((answerText, idx) => {
          const num = idx + 1
          const isSelected = selectedAnswer === num
          const isCorrectAnswer = question.correct_answer_index === num
          const showResult = quizState === 'feedback'

          // Enhanced feedback styles
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
          const communityPct = communityStats ? communityStats[num] : null

          return (
            <button
              key={num}
              onClick={() => quizState === 'question' && handleAnswer(num)}
              disabled={quizState === 'feedback'}
              className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] ${cardStyle} ${
                shouldShake ? 'animate-shake' : ''
              }`}
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

              {/* Community stats bar */}
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
      </div>

      {/* Feedback section */}
      {quizState === 'feedback' && (
        <div className="px-4 pt-4 pb-6">
          {/* XP Float animation */}
          {xpFloat && (
            <div key={xpFloat.key} className="flex justify-center mb-3 animate-float-up">
              <span className="text-akka-green font-bold text-lg">+{xpFloat.amount} XP</span>
            </div>
          )}

          {/* Explanation card — enhanced readability */}
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
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
            </div>
            <p className="text-sm text-[#1A1A1A] leading-relaxed font-medium">
              {question[`explanation_${lang}`] || question.explanation_en}
            </p>
            <p className={`text-xs mt-2 font-semibold ${isCorrect ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
              Answered in {timeSpentSec}s
              {answers[answers.length - 1]?.speedBonus > 0 && ' · ⚡ Speed bonus!'}
            </p>
          </div>

          {/* Next button */}
          <Button variant="primary" className="w-full gap-2" onClick={handleNext}>
            {currentIndex + 1 < questions.length ? (
              <>
                Next Question
                <ChevronRight size={18} />
              </>
            ) : (
              'See Results'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * QuizHeader — back button + optional mute toggle.
 */
function QuizHeader({ onBack, muted, onToggleMute }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-akka-border">
      <button
        onClick={onBack}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft size={20} />
      </button>
      <h1 className="text-lg font-bold text-akka-text">Quiz of the Day</h1>
      <button
        onClick={onToggleMute}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
      >
        {muted ? <VolumeX size={18} className="text-gray-400" /> : <Volume2 size={18} className="text-akka-text-secondary" />}
      </button>
    </div>
  )
}
