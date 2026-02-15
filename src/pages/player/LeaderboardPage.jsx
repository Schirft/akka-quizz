import { Trophy } from 'lucide-react'

/**
 * LeaderboardPage — placeholder for the cohort leaderboard.
 */
export default function LeaderboardPage() {
  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-akka-text mb-6">Leaderboard</h1>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
          <Trophy size={32} className="text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-akka-text mb-2">Rankings</h2>
        <p className="text-akka-text-secondary text-center">
          Weekly cohort leaderboard with leagues.
        </p>
        <p className="text-sm text-akka-text-secondary mt-4">Coming in Phase 3</p>
      </div>
    </div>
  )
}
