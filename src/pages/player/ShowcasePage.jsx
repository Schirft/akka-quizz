import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PuzzleRenderer from '../../components/puzzles/PuzzleRenderer'
import Button from '../../components/ui/Button'
import { SHOWCASE_PACKS } from '../../data/showcaseData'
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
  playQuizComplete,
  playPerfect,
  isMuted,
  toggleMute,
} from '../../lib/sounds'
import { getRandomEncouragement, getQuizText, getScoreMessage } from '../../utils/quizI18n'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Home,
  Share2,
  RotateCcw,
} from 'lucide-react'

/**
 * ShowcasePage — 15 hardcoded quiz packs for demo/showcase.
 * Reuses existing PuzzleRenderer and mimics QuizPage UX.
 * No Supabase calls — all data from showcaseData.js.
 */
export default function ShowcasePage() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(() => localStorage.getItem('akka_lang') || 'en')
  const [activePack, setActivePack] = useState(null) // null = grid view
  const [filter, setFilter] = useState('all') // all | Easy | Medium | Hard

  // Quiz runner state
  const [phase, setPhase] = useState('grid') // grid | ready | question | feedback | puzzle | puzzle_feedback | lesson | results
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS)
  const [timeSpentMs, setTimeSpentMs] = useState(0)
  const [answers, setAnswers] = useState([])
  const [xpFloat, setXpFloat] = useState(null)
  const [shakeAnswer, setShakeAnswer] = useState(false)
  const [timerMessage, setTimerMessage] = useState(null)
  const [muted, setMutedState] = useState(isMuted)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [showEncouragement, setShowEncouragement] = useState(null)
  const [memberStats, setMemberStats] = useState(null)

  // Puzzle state
  const [puzzleData, setPuzzleData] = useState(null)
  const [puzzleAnswer, setPuzzleAnswer] = useState(null)
  const [puzzleCorrect, setPuzzleCorrect] = useState(null)

  // Lesson state
  const [lessonData, setLessonData] = useState(null)

  // Confetti
  const [showConfetti, setShowConfetti] = useState(false)

  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const lastTickRef = useRef(null)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Markdown renderer (same as QuizPage)
  function renderMarkdown(text) {
    if (!text) return null
    const paragraphs = text.split(/\n\n+/)
    return paragraphs.map((para, pi) => {
      const trimmed = para.trim()
      if (!trimmed) return null
      const boldLineMatch = trimmed.match(/^\*\*(.+?)\*\*$/)
      if (boldLineMatch) {
        return (
          <div key={pi} className="flex items-start gap-2 mt-4 mb-2">
            <div className="w-1 h-5 rounded-full bg-akka-green shrink-0 mt-0.5" />
            <h4 className="text-sm font-bold text-akka-dark">{boldLineMatch[1]}</h4>
          </div>
        )
      }
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/)
      const rendered = parts.map((part, partIdx) => {
        const inlineBold = part.match(/^\*\*(.+)\*\*$/)
        if (inlineBold) return <strong key={partIdx} className="font-semibold text-akka-dark">{inlineBold[1]}</strong>
        return <span key={partIdx}>{part}</span>
      })
      return <p key={pi} className="text-sm text-gray-700 leading-relaxed mb-3">{rendered}</p>
    })
  }

  function handleToggleMute() {
    const next = toggleMute()
    setMutedState(next)
  }

  // Start a pack quiz
  function startPack(pack) {
    // Shuffle answers like QuizPage does
    const shuffledQuestions = pack.questions.map((q) => {
      const answersEn = q.answers_en || []
      const correctIdx = q.correct_answer_index
      const indexed = answersEn.map((text, i) => ({ text, originalIndex: i + 1 }))
      for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indexed[i], indexed[j]] = [indexed[j], indexed[i]]
      }
      const newCorrectIndex = indexed.findIndex((a) => a.originalIndex === correctIdx) + 1
      const shuffledEn = indexed.map((a) => a.text)
      const shuffledFr = q.answers_fr ? indexed.map((a) => q.answers_fr[a.originalIndex - 1]) : null
      return { ...q, answers_en: shuffledEn, answers_fr: shuffledFr, correct_answer_index: newCorrectIndex }
    })

    setActivePack(pack)
    setQuestions(shuffledQuestions)
    setPuzzleData(pack.puzzle || null)
    setLessonData(pack.lesson || null)
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsCorrect(null)
    setAnswers([])
    setCombo(0)
    setMaxCombo(0)
    setPuzzleAnswer(null)
    setPuzzleCorrect(null)
    setXpFloat(null)
    setShakeAnswer(false)
    setTimerMessage(null)
    setMemberStats(null)
    setShowEncouragement(null)
    setShowConfetti(false)
    setPhase('ready')
    window.scrollTo(0, 0)
  }

  // Reset to grid
  function backToGrid() {
    if (timerRef.current) clearInterval(timerRef.current)
    setActivePack(null)
    setPhase('grid')
    setQuestions([])
    setPuzzleData(null)
    setLessonData(null)
    window.scrollTo(0, 0)
  }

  // Timer
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
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        handleTimeUp()
      }
    }, 100)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  function processAnswer(answerIndex, elapsedMs) {
    const question = questions[currentIndex]
    const correct = answerIndex === question.correct_answer_index
    const clampedMs = Math.min(elapsedMs, QUESTION_TIMER_SECONDS * 1000)
    const elapsedSec = Math.round(clampedMs / 1000)

    let xpEarned = 0
    let speedBonus = 0
    if (correct) {
      xpEarned += XP_CORRECT_ANSWER
      if (elapsedSec <= SPEED_FAST_THRESHOLD) speedBonus = XP_SPEED_BONUS_FAST
      else if (elapsedSec <= SPEED_MEDIUM_THRESHOLD) speedBonus = XP_SPEED_BONUS_MEDIUM
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

    if (xpEarned > 0) setXpFloat({ amount: xpEarned, key: Date.now() })

    setAnswers(prev => [...prev, {
      questionId: question.id,
      selectedIndex: answerIndex,
      correct,
      timeMs: clampedMs,
      xpEarned,
      speedBonus,
    }])

    setPhase('feedback')
  }

  function handleNext() {
    playTap()
    setSelectedAnswer(null)
    setIsCorrect(null)
    setXpFloat(null)
    setShakeAnswer(false)
    setTimerMessage(null)
    setMemberStats(null)
    setShowEncouragement(null)

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1)
      setPhase('question')
      startTimer()
    } else if (puzzleData && !puzzleAnswer) {
      setPhase('puzzle')
    } else if (lessonData && phase !== 'lesson') {
      setPhase('lesson')
    } else {
      finishQuiz()
    }
  }

  function handlePuzzleAnswer(answer) {
    const correct = String(answer) === String(puzzleData.answer)
    setPuzzleAnswer(answer)
    setPuzzleCorrect(correct)
    if (correct) playCorrect()
    else playWrong()
    setPhase('puzzle_feedback')
  }

  function finishQuiz() {
    const score = answers.filter(a => a.correct).length
    const isPerfect = score === questions.length
    const totalXP = XP_QUIZ_STARTED + answers.reduce((sum, a) => sum + a.xpEarned, 0) + (isPerfect ? XP_PERFECT_QUIZ : 0)

    if (isPerfect) {
      playPerfect()
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    } else {
      playQuizComplete()
      if (score >= questions.length - 1) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
    }

    setPhase('results')
  }

  // i18n helpers
  const txt = (enKey, frKey) => lang === 'fr' ? frKey : enKey

  // Filtered packs
  const filteredPacks = filter === 'all' ? SHOWCASE_PACKS : SHOWCASE_PACKS.filter(p => p.difficulty === filter)

  // Current question data
  const question = questions[currentIndex]
  const questionText = question ? (question[`question_${lang}`] || question.question_en) : ''
  const answersArr = question ? (question[`answers_${lang}`] || question.answers_en || []) : []
  const explanation = question ? (question[`explanation_${lang}`] || question.explanation_en) : ''
  const timeSpentSec = Math.round(timeSpentMs / 1000)
  const timerProgress = timeLeft / QUESTION_TIMER_SECONDS
  const timerPercent = (timeLeft / QUESTION_TIMER_SECONDS) * 100
  const timerColor = timerPercent > 50 ? 'text-[#3498DB]' : timerPercent > 25 ? 'text-[#F39C12]' : 'text-[#E74C3C]'
  const timerBarColor = timerPercent > 50 ? 'bg-[#3498DB]' : timerPercent > 25 ? 'bg-[#F39C12]' : 'bg-[#E74C3C] animate-pulse'
  const timerBg = timerPercent > 50 ? 'bg-blue-50' : timerPercent > 25 ? 'bg-amber-50' : 'bg-red-50'
  const isCritical = timeLeft <= TIMER_CRITICAL_SECONDS && timeLeft > 0 && phase === 'question'

  // Difficulty badge colors
  const diffColor = { Easy: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', Hard: 'bg-red-100 text-red-700' }

  // ==================== GRID VIEW ====================
  if (phase === 'grid') {
    return (
      <div className="min-h-screen bg-[#E5E7EB]">
        <div className="max-w-md mx-auto min-h-screen shadow-xl bg-akka-bg">
          {/* Header */}
          <div className="bg-[#1B3D2F] px-4 pt-6 pb-5">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigate('/')} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-white">{txt('Showcase', 'Vitrine')}</h1>
                <p className="text-sm text-[#A7C4B8]">{txt('15 quiz packs to explore', '15 packs quiz a explorer')}</p>
              </div>
              {/* Lang toggle */}
              <button
                onClick={() => setLang(l => l === 'en' ? 'fr' : 'en')}
                className="px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-bold hover:bg-white/20 transition-colors"
              >
                {lang === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2">
              {['all', 'Easy', 'Medium', 'Hard'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    filter === f ? 'bg-white text-[#1B3D2F]' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {f === 'all' ? txt('All', 'Tous') : f} {f !== 'all' && `(${SHOWCASE_PACKS.filter(p => p.difficulty === f).length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Pack Grid */}
          <div className="px-4 py-4 grid grid-cols-2 gap-3">
            {filteredPacks.map((pack, idx) => (
              <button
                key={pack.id}
                onClick={() => startPack(pack)}
                className="bg-white rounded-2xl p-4 text-left border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.97] relative overflow-hidden"
              >
                {/* Pack number badge */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-400">{SHOWCASE_PACKS.indexOf(pack) + 1}</span>
                </div>
                {/* Icon */}
                <div className="text-3xl mb-2">{pack.icon}</div>
                {/* Theme */}
                <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1.5">
                  {lang === 'fr' ? pack.theme_fr : pack.theme}
                </h3>
                {/* Difficulty badge */}
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${diffColor[pack.difficulty]}`}>
                  {pack.difficulty}
                </span>
                {/* Meta */}
                <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
                  <span>3Q</span>
                  <span>+</span>
                  <span>{pack.puzzle?.interaction_type === 'ab_choice' ? 'AB' : pack.visual_type?.replace('_', ' ')}</span>
                  <span>+</span>
                  <span>{txt('Lesson', 'Lecon')}</span>
                </div>
                {/* Play indicator */}
                <div className="mt-3 flex items-center gap-1.5 text-[#1B3D2F]">
                  <Play size={14} fill="#1B3D2F" />
                  <span className="text-xs font-bold">{txt('Play', 'Jouer')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ==================== READY SCREEN ====================
  if (phase === 'ready' && activePack) {
    return (
      <div className="min-h-screen bg-[#E5E7EB]">
        <div className="max-w-md mx-auto min-h-screen shadow-xl bg-gradient-to-b from-[#1B3D2F] via-[#1B3D2F] to-[#0B1A14] flex flex-col">
          <ShowcaseHeader onBack={backToGrid} muted={muted} onToggleMute={handleToggleMute} title={txt('Showcase Quiz', 'Quiz Vitrine')} dark />
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-[#2ECC71] opacity-20 blur-2xl scale-150" />
              <div className="relative w-24 h-24 rounded-3xl bg-[#2ECC71]/15 flex items-center justify-center border border-[#2ECC71]/20">
                <span className="text-5xl drop-shadow-lg">{activePack.icon}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3 px-4 py-2 rounded-full bg-amber-400/20 border border-amber-400/30">
              <span className="text-lg">🎯</span>
              <span className="text-sm font-bold text-amber-300">Showcase</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {lang === 'fr' ? activePack.theme_fr : activePack.theme}
            </h2>
            <p className="text-[#A7C4B8] text-center mb-1">
              {questions.length} questions · {QUESTION_TIMER_SECONDS}s {txt('per question', 'par question')}
            </p>
            <p className="text-xs text-[#A7C4B8] mb-4">
              {txt('Answer quickly for speed bonus XP!', 'Reponds vite pour des bonus XP !')}
            </p>
            <span className={`inline-block mb-6 px-3 py-1 rounded-full text-xs font-bold ${diffColor[activePack.difficulty]}`}>
              {activePack.difficulty}
            </span>
            <button
              onClick={handleStart}
              className="relative w-full max-w-xs py-4 rounded-2xl bg-[#2ECC71] text-white font-bold text-lg shadow-lg shadow-[#2ECC71]/30 active:scale-[0.97] transition-transform overflow-hidden"
            >
              <span className="relative z-10">{txt('Start Quiz', 'Commencer le Quiz')}</span>
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==================== PUZZLE PHASE ====================
  if ((phase === 'puzzle' || phase === 'puzzle_feedback') && puzzleData) {
    const puzzleExplanation = puzzleData[`explanation_${lang}`] || puzzleData.explanation || ''
    return (
      <div className="min-h-screen bg-[#E5E7EB]">
        <div className="max-w-md mx-auto min-h-screen shadow-xl bg-akka-bg flex flex-col pb-24">
          <ShowcaseHeader onBack={backToGrid} muted={muted} onToggleMute={handleToggleMute} title={txt('Problem of the Day', 'Problème du Jour')} />
          <div className="flex-1 px-4 pt-4">
            <PuzzleRenderer puzzle={puzzleData} onAnswer={handlePuzzleAnswer} lang={lang} />
          </div>

          {phase === 'puzzle_feedback' && (
            <>
              <div className="fixed inset-0 bg-black/20 z-[55]" />
              <div className={`fixed bottom-0 left-0 right-0 z-[60] animate-slide-up rounded-t-3xl shadow-2xl ${
                puzzleCorrect ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'
              }`}>
                <div className="px-5 pt-5 pb-24 max-w-lg mx-auto max-h-[75vh] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3">
                    {puzzleCorrect ? <CheckCircle size={24} className="text-[#2ECC71] shrink-0" /> : <XCircle size={24} className="text-[#E74C3C] shrink-0" />}
                    <p className={`text-lg font-bold ${puzzleCorrect ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
                      {puzzleCorrect ? txt('Correct!', 'Correct !') : getQuizText('wrongAnswer', lang)}
                    </p>
                  </div>
                  <p className="text-sm text-[#1A1A1A] leading-relaxed font-medium mb-4">{puzzleExplanation}</p>
                  <Button variant="primary" className="w-full" onClick={() => lessonData ? setPhase('lesson') : finishQuiz()}>
                    {lessonData ? txt('Continue', 'Continuer') : txt('See Results', 'Voir les resultats')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ==================== LESSON PHASE ====================
  if (phase === 'lesson' && lessonData) {
    const lessonTitle = lessonData[`title_${lang}`] || lessonData.title_en || 'Lesson'
    const lessonContent = lessonData[`content_${lang}`] || lessonData.content_en || ''
    const lessonTakeaway = lessonData[`key_takeaway_${lang}`] || lessonData.key_takeaway_en || ''
    const lessonTheme = lessonData.theme || null

    return (
      <div className="min-h-screen bg-[#E5E7EB]">
        <div className="max-w-md mx-auto min-h-screen shadow-xl bg-akka-bg flex flex-col pb-24">
          <ShowcaseHeader onBack={backToGrid} muted={muted} onToggleMute={handleToggleMute} title={txt('Lesson', 'Lecon')} />
          <div className="flex-1 px-4 pt-6">
            <div className="text-center mb-5">
              <span className="text-4xl mb-2 block">{activePack?.icon || '📖'}</span>
              <h2 className="text-xl font-bold text-akka-text">{lessonTitle}</h2>
              {lessonTheme && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  {lessonTheme.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-akka-border p-5 mb-4">
              <div>{renderMarkdown(lessonContent)}</div>
            </div>
            {lessonTakeaway && (
              <div className="bg-[#1B3D2F] rounded-2xl p-4 mb-6">
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wide mb-1">{txt('Key Takeaway', 'Point cle')}</p>
                <p className="text-sm font-medium text-white leading-relaxed">{lessonTakeaway}</p>
              </div>
            )}
            <Button variant="primary" className="w-full" onClick={finishQuiz}>
              {txt('See Results', 'Voir les resultats')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ==================== RESULTS PHASE ====================
  if (phase === 'results') {
    const score = answers.filter(a => a.correct).length
    const totalQuestions = questions.length
    const isPerfect = score === totalQuestions
    const totalXP = XP_QUIZ_STARTED + answers.reduce((sum, a) => sum + a.xpEarned, 0) + (isPerfect ? XP_PERFECT_QUIZ : 0)
    const comboBonus = maxCombo >= 3 ? 15 : maxCombo >= 2 ? 5 : 0
    const streakBonus = 0
    const dailyBonus = 10
    const correctXP = score * 10
    const computedTotalXP = correctXP + comboBonus + streakBonus + dailyBonus
    const percentile = Math.min(99, Math.round((score / totalQuestions) * 80 + Math.random() * 15))

    const xpLines = [
      { icon: '🎯', label: getQuizText('xpCorrectAnswers', lang), detail: `${score} x 10`, value: correctXP },
      { icon: '🔥', label: getQuizText('xpComboBonus', lang), detail: `max ${maxCombo}x`, value: comboBonus },
      { icon: '⚡', label: getQuizText('xpStreakBonus', lang), detail: '', value: streakBonus },
      { icon: '⭐', label: getQuizText('xpDailyBonus', lang), detail: '', value: dailyBonus },
    ]

    return (
      <div className="min-h-screen bg-[#E5E7EB]">
        <div className="max-w-md mx-auto min-h-screen shadow-xl relative">
          {/* Confetti */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#2ECC71', '#F1C40F', '#E74C3C', '#3498DB', '#9B59B6', '#1B3D2F'][i % 6],
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${1.5 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="bg-gradient-to-b from-[#1B3D2F] via-[#1B3D2F] to-[#0B1A14] min-h-screen">
            <div className="max-w-[480px] mx-auto px-4 pt-8 pb-6">
              <h2 className={`text-3xl font-black text-center mb-2 ${isPerfect ? 'animate-gradient-text' : 'text-white'}`}>
                {getScoreMessage(score, lang)}
              </h2>

              {/* Score circle */}
              <motion.div
                className="flex justify-center my-6"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
              >
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <motion.circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="#2ECC71" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42}
                      initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - score / totalQuestions) }}
                      transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-[#2ECC71]">{score}</span>
                    <span className="text-sm font-semibold text-white/50">/ {totalQuestions}</span>
                  </div>
                </div>
              </motion.div>

              {/* XP Breakdown */}
              <div className={isPerfect ? 'animate-star-border' : ''}>
                <div className="bg-[#0B1A14] rounded-3xl p-6">
                  <div className="space-y-0">
                    {xpLines.map((line, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center py-2 border-b border-white/5 opacity-0 animate-fade-in"
                        style={{ animationDelay: `${0.8 + i * 0.3}s`, animationFillMode: 'forwards' }}
                      >
                        <span className="text-gray-300 text-sm">
                          {line.icon} {line.label} {line.detail && <span className="text-gray-500">({line.detail})</span>}
                        </span>
                        <span className="text-[#2ECC71] font-bold">{line.value > 0 ? `+${line.value}` : '0'} XP</span>
                      </div>
                    ))}
                    <motion.div
                      className="flex justify-between items-center py-3 mt-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.2 }}
                    >
                      <span className="text-white font-bold">{getQuizText('xpTotal', lang)}</span>
                      <motion.span
                        className="text-[#2ECC71] font-black text-2xl"
                        initial={{ scale: 0.5 }}
                        animate={{ scale: [0.5, 1.2, 1] }}
                        transition={{ type: 'spring', delay: 2.5, duration: 0.6 }}
                      >
                        +{computedTotalXP} XP
                      </motion.span>
                    </motion.div>
                  </div>
                </div>
              </div>

              <p className="text-center text-gray-300 mt-6 opacity-0 animate-fade-in" style={{ animationDelay: '2.8s', animationFillMode: 'forwards' }}>
                {getQuizText('betterThan', lang)} <span className="text-[#2ECC71] font-bold text-xl">{percentile}%</span> {getQuizText('ofMembers', lang)}
              </p>

              {/* Action buttons */}
              <div className="space-y-3 mt-8">
                <button
                  onClick={backToGrid}
                  className="w-full py-4 rounded-2xl bg-[#1B3D2F] text-white font-bold text-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  {txt('Back to Showcase', 'Retour a la Vitrine')}
                </button>
                <button
                  onClick={() => startPack(activePack)}
                  className="w-full py-3 rounded-2xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  <Play size={18} />
                  {txt('Replay this Pack', 'Rejouer ce Pack')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== QUESTION + FEEDBACK STATE ====================
  return (
    <div className="min-h-screen bg-[#E5E7EB]">
      <div className="max-w-md mx-auto min-h-screen shadow-xl bg-akka-bg flex flex-col pb-24">
        {/* Header with progress */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-akka-border">
          <button onClick={backToGrid} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex items-center gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < currentIndex ? 'bg-akka-green'
                    : i === currentIndex
                      ? phase === 'feedback' ? (isCorrect ? 'bg-akka-green' : 'bg-akka-red') : 'bg-akka-dark'
                      : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className={`min-w-[52px] h-9 rounded-full flex items-center justify-center gap-1 px-2.5 ${timerBg} ${isCritical ? 'animate-timer-pulse' : ''}`}>
            <Clock size={14} className={timerColor} />
            <span className={`text-sm font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
          </div>
          <button onClick={handleToggleMute} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors">
            {muted ? <VolumeX size={18} className="text-gray-400" /> : <Volume2 size={18} className="text-akka-text-secondary" />}
          </button>
        </div>

        {/* Timer bar */}
        {phase === 'question' && (
          <div className="w-full h-2 bg-gray-100">
            <div className={`h-full rounded-r-full transition-all duration-200 ease-linear ${timerBarColor}`} style={{ width: `${timerProgress * 100}%` }} />
          </div>
        )}

        {/* Encouragement speech bubble */}
        {showEncouragement && (
          <div className="fixed top-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="animate-speech-bubble bg-[#1B3D2F] text-white font-bold text-lg px-6 py-3 rounded-2xl shadow-lg relative">
              {showEncouragement}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1B3D2F] rotate-45" />
            </div>
          </div>
        )}

        {/* Combo counter */}
        {combo >= 2 && (
          <div className="animate-combo animate-glow text-center py-1">
            <span className="text-2xl font-black text-[#1B3D2F]">{combo}x {getQuizText('combo', lang)}</span>
          </div>
        )}

        {/* Question counter */}
        <div className="px-4 pt-4">
          <p className="text-xs font-semibold text-akka-text-secondary uppercase tracking-wide">
            {txt('Question', 'Question')} {currentIndex + 1} {txt('of', 'sur')} {questions.length}
          </p>
        </div>

        {/* Question text */}
        <div key={currentIndex} className="px-4 pt-3 pb-4 animate-slide-in">
          <h2 className="text-lg font-bold text-akka-text leading-snug">{questionText}</h2>
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

            return (
              <button
                key={num}
                onClick={() => phase === 'question' && handleAnswer(num)}
                disabled={phase === 'feedback'}
                className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] ${cardStyle} ${
                  shouldShake ? 'animate-shake' : shouldPulse ? 'animate-pulse-select' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    showResult && isCorrectAnswer ? 'bg-[#2ECC71] text-white'
                      : showResult && isSelected && !isCorrect ? 'bg-[#E74C3C] text-white'
                        : isSelected && !showResult ? 'bg-white text-akka-dark'
                          : 'bg-gray-100 text-akka-text-secondary'
                  }`}>
                    {showResult && isCorrectAnswer ? <CheckCircle size={16} />
                      : showResult && isSelected && !isCorrect ? <XCircle size={16} />
                        : String.fromCharCode(64 + num)}
                  </div>
                  <span className={`text-sm flex-1 ${textColor} ${fontWeight}`}>{answerText}</span>
                </div>
              </button>
            )
          })}

          {/* Kahoot-style member stats */}
          {phase === 'feedback' && memberStats && (
            <div className="mt-5 px-1">
              <p className="text-xs font-semibold text-akka-text-secondary uppercase tracking-wide mb-3">{getQuizText('membersAnswered', lang)}</p>
              <div className="space-y-2">
                {answersArr.map((ansText, i) => {
                  const pct = memberStats[i]
                  const isCorrectIdx = i === question.correct_answer_index - 1
                  const isSelectedIdx = i === selectedAnswer - 1
                  const barColor = isCorrectIdx ? 'bg-[#1B3D2F]' : isSelectedIdx ? 'bg-[#E74C3C]' : 'bg-[#E5E7EB]'
                  const barTextColor = isCorrectIdx || isSelectedIdx ? 'text-white' : 'text-akka-text'
                  const letter = String.fromCharCode(65 + i)
                  return (
                    <div key={i} className="relative h-10 rounded-xl overflow-hidden bg-gray-100">
                      <div className={`absolute inset-y-0 left-0 rounded-xl ${barColor} transition-all duration-700 ease-out`} style={{ width: `${Math.max(pct, 8)}%` }} />
                      <div className="relative h-full flex items-center px-3 gap-2">
                        <span className={`text-xs font-bold ${barTextColor} w-5 shrink-0`}>{letter}</span>
                        <span className={`text-xs font-medium ${barTextColor} flex-1 truncate`}>{ansText}</span>
                        <span className={`text-xs font-bold ${barTextColor} shrink-0`}>{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom sheet feedback */}
        {phase === 'feedback' && (
          <>
            <div className="fixed inset-0 bg-black/20 z-[55]" />
            <div className={`fixed bottom-0 left-0 right-0 z-[60] animate-slide-up rounded-t-3xl shadow-2xl ${
              isCorrect ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]'
            }`}>
              <div className="px-5 pt-5 pb-24 max-w-lg mx-auto max-h-[75vh] overflow-y-auto">
                {xpFloat && (
                  <div key={xpFloat.key} className="flex justify-center mb-2 animate-float-up">
                    <span className="text-[#1B3D2F] font-bold text-lg">+{xpFloat.amount} XP</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  {isCorrect ? <CheckCircle size={24} className="text-[#2ECC71] shrink-0" /> : <XCircle size={24} className="text-[#E74C3C] shrink-0" />}
                  <p className={`text-lg font-bold ${isCorrect ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
                    {isCorrect ? txt('Correct!', 'Correct !') : getQuizText('wrongAnswer', lang)}
                  </p>
                </div>
                <p className="text-sm text-[#1A1A1A] leading-relaxed font-medium mb-2">{explanation}</p>
                <p className={`text-xs font-semibold mb-4 ${isCorrect ? 'text-[#166534]' : 'text-[#991B1B]'}`}>
                  {txt('Answered in', 'Repondu en')} {timeSpentSec}s
                  {answers[answers.length - 1]?.speedBonus > 0 && ` · ⚡ ${txt('Speed bonus!', 'Bonus de rapidite !')}`}
                </p>
                <Button variant="primary" className="w-full gap-2" onClick={handleNext}>
                  {currentIndex + 1 < questions.length ? (
                    <>{txt('Next Question', 'Question suivante')} <ChevronRight size={18} /></>
                  ) : (
                    txt('Continue', 'Continuer')
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * ShowcaseHeader — back button + title + mute toggle.
 */
function ShowcaseHeader({ onBack, muted, onToggleMute, title, dark }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b ${dark ? 'border-white/10' : 'border-akka-border'}`}>
      <button onClick={onBack} className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}>
        <ArrowLeft size={20} className={dark ? 'text-white' : ''} />
      </button>
      <h1 className={`text-lg font-bold ${dark ? 'text-white' : 'text-akka-text'}`}>{title}</h1>
      <button onClick={onToggleMute} className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}>
        {muted ? <VolumeX size={18} className={dark ? 'text-white/40' : 'text-gray-400'} /> : <Volume2 size={18} className={dark ? 'text-white/60' : 'text-akka-text-secondary'} />}
      </button>
    </div>
  )
}
