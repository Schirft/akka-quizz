import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
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
} from 'lucide-react'

/**
 * QuizPage — the full quiz experience with timer, feedback, and transitions.
 * Loads today's daily_quiz, presents 5 questions with 15s timer each,
 * shows feedback after each answer, then navigates to results.
 */
export default function QuizPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Quiz state
  const [quizState, setQuizState] = useState('loading') // loading | ready | question | feedback | error
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS)
  const [timeSpent, setTimeSpent] = useState(0)
  const [answers, setAnswers] = useState([]) // { questionId, selectedIndex, correct, timeSpent, xpEarned }
  const [quizId, setQuizId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [xpFloat, setXpFloat] = useState(null) // { amount, key } for floating XP animation
  const [communityStats, setCommunityStats] = useState(null) // { answer_1: %, answer_2: %, ... }

  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

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
          .select('id, question_ids')
          .eq('quiz_date', today)
          .eq('status', 'active')
          .single()

        if (dqError || !dailyQuiz) {
          setErrorMsg('No quiz available for today. Try seeding a test quiz from the home page.')
          setQuizState('error')
          return
        }

        setQuizId(dailyQuiz.id)

        // Fetch questions by IDs
        const { data: questionData, error: qError } = await supabase
          .from('questions')
          .select('*')
          .in('id', dailyQuiz.question_ids)

        if (qError || !questionData || questionData.length === 0) {
          setErrorMsg('Could not load quiz questions.')
          setQuizState('error')
          return
        }

        // Order questions to match question_ids order
        const ordered = dailyQuiz.question_ids
          .map((id) => questionData.find((q) => q.id === id))
          .filter(Boolean)

        setQuestions(ordered)
        setQuizState('ready')
      } catch (err) {
        console.error('Quiz load error:', err)
        setErrorMsg('Something went wrong loading the quiz.')
        setQuizState('error')
      }
    }

    if (user) loadQuiz()
  }, [user])

  // Start the timer when entering question state
  const startTimer = useCallback(() => {
    setTimeLeft(QUESTION_TIMER_SECONDS)
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const remaining = Math.max(QUESTION_TIMER_SECONDS - elapsed, 0)
      setTimeLeft(remaining)

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

  // Start quiz
  function handleStart() {
    setQuizState('question')
    startTimer()
  }

  // Time expired — auto-submit as incorrect
  function handleTimeUp() {
    if (quizState !== 'question') return
    processAnswer(null, QUESTION_TIMER_SECONDS)
  }

  // Player selects an answer
  function handleAnswer(answerIndex) {
    if (selectedAnswer !== null) return // prevent double-tap
    clearInterval(timerRef.current)

    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    processAnswer(answerIndex, elapsed)
  }

  // Process the selected answer
  function processAnswer(answerIndex, elapsed) {
    const question = questions[currentIndex]
    const correct = answerIndex === question.correct_answer_index
    const clamped = Math.min(elapsed, QUESTION_TIMER_SECONDS)

    // Calculate XP
    let xpEarned = 0
    if (correct) {
      xpEarned += XP_CORRECT_ANSWER
      if (clamped <= SPEED_FAST_THRESHOLD) {
        xpEarned += XP_SPEED_BONUS_FAST
      } else if (clamped <= SPEED_MEDIUM_THRESHOLD) {
        xpEarned += XP_SPEED_BONUS_MEDIUM
      }
    }

    setSelectedAnswer(answerIndex)
    setIsCorrect(correct)
    setTimeSpent(clamped)

    // Show floating XP
    if (xpEarned > 0) {
      setXpFloat({ amount: xpEarned, key: Date.now() })
    }

    // Record answer
    setAnswers((prev) => [
      ...prev,
      {
        questionId: question.id,
        selectedIndex: answerIndex,
        correct,
        timeSpent: clamped,
        xpEarned,
      },
    ])

    // Load community stats for this question
    loadCommunityStats(question.id)

    setQuizState('feedback')
  }

  // Load how other players answered
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

  // Move to next question or finish
  function handleNext() {
    setSelectedAnswer(null)
    setIsCorrect(null)
    setXpFloat(null)
    setCommunityStats(null)

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1)
      setQuizState('question')
      startTimer()
    } else {
      // Quiz finished — navigate to results
      finishQuiz()
    }
  }

  // Save quiz session and navigate to results
  async function finishQuiz() {
    const score = answers.filter((a) => a.correct).length
    const totalXP =
      XP_QUIZ_STARTED +
      answers.reduce((sum, a) => sum + a.xpEarned, 0) +
      (score === QUESTIONS_PER_QUIZ ? XP_PERFECT_QUIZ : 0)
    const avgTime =
      answers.length > 0
        ? Math.round(answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length)
        : 0

    const today = new Date().toISOString().split('T')[0]

    try {
      // Save quiz session
      const { data: session, error: sError } = await supabase
        .from('quiz_sessions')
        .insert({
          user_id: user.id,
          daily_quiz_id: quizId,
          quiz_date: today,
          score,
          total_questions: questions.length,
          xp_earned: totalXP,
          time_seconds: answers.reduce((sum, a) => sum + a.timeSpent, 0),
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (sError) console.error('Session save error:', sError)

      // Save individual answers
      if (session) {
        const answerRows = answers.map((a) => ({
          session_id: session.id,
          question_id: a.questionId,
          user_id: user.id,
          selected_answer: a.selectedIndex,
          is_correct: a.correct,
          time_seconds: a.timeSpent,
          xp_earned: a.xpEarned,
        }))

        const { error: aError } = await supabase.from('quiz_answers').insert(answerRows)

        if (aError) console.error('Answers save error:', aError)
      }

      // Update profile XP + streak
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('total_xp, streak_days, last_quiz_date, quizzes_completed')
        .eq('id', user.id)
        .single()

      if (currentProfile) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        let newStreak = 1
        if (currentProfile.last_quiz_date === yesterdayStr) {
          newStreak = (currentProfile.streak_days || 0) + 1
        } else if (currentProfile.last_quiz_date === today) {
          newStreak = currentProfile.streak_days || 1
        }

        await supabase
          .from('profiles')
          .update({
            total_xp: (currentProfile.total_xp || 0) + totalXP,
            streak_days: newStreak,
            last_quiz_date: today,
            quizzes_completed: (currentProfile.quizzes_completed || 0) + 1,
          })
          .eq('id', user.id)
      }
    } catch (err) {
      console.error('Quiz finish error:', err)
    }

    // Navigate to results
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
  const lang = 'en' // TODO: dynamic language support

  // Timer color
  const timerColor =
    timeLeft <= TIMER_CRITICAL_SECONDS
      ? 'text-akka-red'
      : timeLeft <= TIMER_WARNING_SECONDS
        ? 'text-amber-500'
        : 'text-akka-green'

  const timerBg =
    timeLeft <= TIMER_CRITICAL_SECONDS
      ? 'bg-red-50'
      : timeLeft <= TIMER_WARNING_SECONDS
        ? 'bg-amber-50'
        : 'bg-emerald-50'

  // Loading state
  if (quizState === 'loading') {
    return (
      <div className="min-h-screen bg-akka-bg flex flex-col items-center justify-center">
        <Loader2 size={32} className="text-akka-green animate-spin mb-4" />
        <p className="text-akka-text-secondary">Loading quiz...</p>
      </div>
    )
  }

  // Error state
  if (quizState === 'error') {
    return (
      <div className="min-h-screen bg-akka-bg flex flex-col">
        <QuizHeader onBack={() => navigate('/')} />
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

  // Ready state — show start screen
  if (quizState === 'ready') {
    return (
      <div className="min-h-screen bg-akka-bg flex flex-col">
        <QuizHeader onBack={() => navigate('/')} />
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
      {/* Header with progress */}
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
        {/* Timer */}
        <div
          className={`min-w-[52px] h-9 rounded-full flex items-center justify-center gap-1 px-2.5 ${timerBg}`}
        >
          <Clock size={14} className={timerColor} />
          <span className={`text-sm font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
        </div>
      </div>

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
        {[1, 2, 3, 4].map((num) => {
          const answerText = question[`answer_${num}_${lang}`] || question[`answer_${num}_en`]
          const isSelected = selectedAnswer === num
          const isCorrectAnswer = question.correct_answer_index === num
          const showResult = quizState === 'feedback'

          let cardStyle = 'bg-white border-akka-border'
          if (showResult) {
            if (isCorrectAnswer) {
              cardStyle = 'bg-emerald-50 border-akka-green'
            } else if (isSelected && !isCorrect) {
              cardStyle = 'bg-red-50 border-akka-red'
            } else {
              cardStyle = 'bg-white border-akka-border opacity-50'
            }
          } else if (isSelected) {
            cardStyle = 'bg-akka-dark border-akka-dark text-white'
          }

          const communityPct = communityStats ? communityStats[num] : null

          return (
            <button
              key={num}
              onClick={() => quizState === 'question' && handleAnswer(num)}
              disabled={quizState === 'feedback'}
              className={`relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] ${cardStyle}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    showResult && isCorrectAnswer
                      ? 'bg-akka-green text-white'
                      : showResult && isSelected && !isCorrect
                        ? 'bg-akka-red text-white'
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
                <span
                  className={`text-sm font-medium flex-1 ${
                    isSelected && !showResult ? 'text-white' : 'text-akka-text'
                  }`}
                >
                  {answerText}
                </span>
              </div>

              {/* Community stats bar (feedback only) */}
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
            <div key={xpFloat.key} className="flex justify-center mb-3 animate-bounce">
              <span className="text-akka-green font-bold text-lg">+{xpFloat.amount} XP</span>
            </div>
          )}

          {/* Explanation card */}
          <Card className="mb-4">
            <div className="flex items-start gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle size={18} className="text-akka-green shrink-0 mt-0.5" />
              ) : (
                <XCircle size={18} className="text-akka-red shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-semibold text-akka-text">
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
            </div>
            <p className="text-sm text-akka-text-secondary leading-relaxed">
              {question[`explanation_${lang}`] || question.explanation_en}
            </p>
            <p className="text-xs text-akka-text-secondary mt-2">
              Answered in {timeSpent}s
              {answers[answers.length - 1]?.xpEarned > XP_CORRECT_ANSWER && ' · Speed bonus!'}
            </p>
          </Card>

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
 * QuizHeader — simple back-button header.
 */
function QuizHeader({ onBack }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-akka-border">
      <button
        onClick={onBack}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft size={20} />
      </button>
      <h1 className="text-lg font-bold text-akka-text">Quiz of the Day</h1>
    </div>
  )
}
