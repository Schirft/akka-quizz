import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain } from 'lucide-react'

/**
 * QuizPage — placeholder for the quiz experience.
 * No TabBar displayed on this page (handled by routing).
 */
export default function QuizPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-akka-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-akka-border">
        <button
          onClick={() => navigate('/')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-akka-text">Quiz of the Day</h1>
      </div>

      {/* Placeholder content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
          <Brain size={32} className="text-akka-green" />
        </div>
        <h2 className="text-xl font-bold text-akka-text mb-2">Quiz</h2>
        <p className="text-akka-text-secondary text-center">
          5-question quiz with timer, feedback, and XP rewards.
        </p>
        <p className="text-sm text-akka-text-secondary mt-4">Coming in Phase 2</p>
      </div>
    </div>
  )
}
