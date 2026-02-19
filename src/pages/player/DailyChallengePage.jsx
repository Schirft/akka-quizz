import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLang } from '../../hooks/useLang'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Loader2, CheckCircle, Puzzle, BookOpen } from 'lucide-react'

/**
 * DailyChallengePage — orchestrates the daily flow:
 *   1. 3 QCM quiz questions (themed)
 *   2. Puzzle ("The Catch")
 *   3. Celebration screen
 *   4. Lesson of the Day
 *
 * Loads today's daily_quizzes row to get question IDs, puzzle_id, lesson_id.
 * If none exists, shows a message.
 */

const WEEKLY_THEMES = {
  1: 'Fundraising & Dilution',
  2: 'Cap Tables & Valuation',
  3: 'Due Diligence',
  4: 'Term Sheets & Legal',
  5: 'Portfolio Strategy',
  6: 'Startup Metrics & KPIs',
  0: 'Ecosystem & Trends',
}

export default function DailyChallengePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { lang, t } = useLang()

  const [loading, setLoading] = useState(true)
  const [dailyQuiz, setDailyQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [step, setStep] = useState('quiz') // 'quiz' | 'puzzle' | 'celebration' | 'lesson'
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(null)

  const today = new Date().toISOString().split('T')[0]
  const dow = new Date().getDay()
  const theme = WEEKLY_THEMES[dow] || 'General'

  useEffect(() => {
    loadDailyChallenge()
  }, [])

  async function loadDailyChallenge() {
    setLoading(true)
    const { data: quiz } = await supabase
      .from('daily_quizzes')
      .select('*')
      .eq('quiz_date', today)
      .single()

    if (!quiz) {
      setLoading(false)
      return
    }

    setDailyQuiz(quiz)

    // Load the 3 questions
    const qIds = [quiz.question_1_id, quiz.question_2_id, quiz.question_3_id].filter(Boolean)
    if (qIds.length > 0) {
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .in('id', qIds)
      // Maintain order
      const ordered = qIds.map((id) => (qs || []).find((q) => q.id === id)).filter(Boolean)
      setQuestions(ordered)
    }

    setLoading(false)
  }

  function handleAnswer(idx) {
    if (answered) return
    setSelectedIdx(idx)
    setAnswered(true)
    const q = questions[currentQ]
    if (q && idx + 1 === q.correct_answer_index) {
      setScore((s) => s + 1)
    }
  }

  function handleNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1)
      setAnswered(false)
      setSelectedIdx(null)
    } else {
      // Move to puzzle
      if (dailyQuiz?.puzzle_id) {
        setStep('puzzle')
      } else if (dailyQuiz?.lesson_id) {
        setStep('lesson')
      } else {
        navigate('/quiz/results')
      }
    }
  }

  function handlePuzzleDone() {
    setStep('celebration')
  }

  function handleCelebrationDone() {
    if (dailyQuiz?.lesson_id) {
      setStep('lesson')
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 size={24} className="text-[#1B3D2F] animate-spin" />
      </div>
    )
  }

  if (!dailyQuiz) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <p className="text-6xl mb-4">📅</p>
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">No Challenge Today</h2>
        <p className="text-sm text-[#6B7280] mb-6 text-center">
          Today's daily challenge hasn't been generated yet. Try the regular quiz instead!
        </p>
        <button
          onClick={() => navigate('/quiz')}
          className="px-6 py-3 bg-[#1B3D2F] text-white font-bold rounded-xl"
        >
          Go to Quiz
        </button>
      </div>
    )
  }

  // ── Step: Quiz (3 QCM) ──
  if (step === 'quiz' && questions.length > 0) {
    const q = questions[currentQ]
    const qText = q[`question_${lang}`] || q.question_en
    const answers = q[`answers_${lang}`] || q.answers_en || []
    const correctIdx = q.correct_answer_index - 1 // convert to 0-based
    const explanation = q[`explanation_${lang}`] || q.explanation_en || ''

    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="p-2 -ml-2">
            <ArrowLeft size={20} className="text-[#6B7280]" />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold">
              {theme}
            </p>
            <p className="text-xs text-[#6B7280]">
              Question {currentQ + 1}/{questions.length}
            </p>
          </div>
          <div className="w-8" />
        </div>

        {/* Progress bar */}
        <div className="px-4 mb-6">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1B3D2F] rounded-full transition-all duration-300"
              style={{ width: `${((currentQ + (answered ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 px-4">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-6 leading-snug">{qText}</h2>

          <div className="space-y-3">
            {answers.map((ans, idx) => {
              let style = 'border-gray-200 bg-white text-[#1A1A1A]'
              if (answered) {
                if (idx === correctIdx) {
                  style = 'border-green-500 bg-green-50 text-green-800'
                } else if (idx === selectedIdx && idx !== correctIdx) {
                  style = 'border-red-500 bg-red-50 text-red-800'
                } else {
                  style = 'border-gray-100 bg-gray-50 text-gray-400'
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-medium text-sm transition-all ${style}`}
                >
                  {ans}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {answered && explanation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800 leading-relaxed">{explanation}</p>
            </div>
          )}
        </div>

        {/* Next button */}
        {answered && (
          <div className="px-4 py-4">
            <button
              onClick={handleNext}
              className="w-full py-3.5 bg-[#1B3D2F] text-white font-bold rounded-xl text-sm"
            >
              {currentQ < questions.length - 1 ? 'Next Question' : 'Continue to Puzzle →'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Step: Puzzle ──
  if (step === 'puzzle') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <Puzzle size={48} className="text-purple-500 mb-4" />
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">The Catch</h2>
        <p className="text-sm text-[#6B7280] mb-6 text-center">
          Time for today's puzzle challenge!
        </p>
        <button
          onClick={() => navigate('/puzzle', { state: { puzzleId: dailyQuiz.puzzle_id, onDone: 'challenge' } })}
          className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl"
        >
          Start Puzzle
        </button>
        <button
          onClick={handlePuzzleDone}
          className="mt-3 text-sm text-[#6B7280] underline"
        >
          Skip for now
        </button>
      </div>
    )
  }

  // ── Step: Celebration ──
  if (step === 'celebration') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1B3D2F] to-[#2D5A45] flex flex-col items-center justify-center px-6 text-white">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Challenge Complete!</h2>
        <p className="text-white/70 mb-2">
          Quiz: {score}/{questions.length} correct
        </p>
        <p className="text-5xl font-black my-4">
          +{score * 20 + 25} XP
        </p>
        <p className="text-sm text-white/60 mb-8">Keep learning to build your investor skills!</p>
        <button
          onClick={handleCelebrationDone}
          className="px-8 py-3.5 bg-white text-[#1B3D2F] font-bold rounded-xl"
        >
          {dailyQuiz?.lesson_id ? "Today's Lesson →" : 'Back Home'}
        </button>
      </div>
    )
  }

  // ── Step: Lesson ──
  if (step === 'lesson') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <BookOpen size={48} className="text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Lesson of the Day</h2>
        <p className="text-sm text-[#6B7280] mb-6 text-center">
          Complete your daily learning journey!
        </p>
        <button
          onClick={() => navigate('/lesson', { state: { lessonId: dailyQuiz.lesson_id } })}
          className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl"
        >
          Start Lesson
        </button>
        <button
          onClick={() => navigate('/')}
          className="mt-3 text-sm text-[#6B7280] underline"
        >
          Skip for now
        </button>
      </div>
    )
  }

  return null
}
