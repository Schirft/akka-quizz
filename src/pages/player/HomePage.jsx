import { useNavigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import { LEVELS } from '../../config/levels'
import Card from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import Button from '../../components/ui/Button'
import { Flame, Play } from 'lucide-react'

/**
 * HomePage — player dashboard showing profile summary and CTA.
 * Displays display_name, level, XP progress, and streak.
 */
export default function HomePage() {
  const { profile, level, levelProgress } = useProfile()
  const navigate = useNavigate()

  if (!profile) return null

  const displayName = profile.display_name || 'Player'
  const totalXP = profile.total_xp || 0
  const streakDays = profile.streak_days || 0
  const nextLevel = level?.level < 10 ? LEVELS[level.level] : null

  return (
    <div className="px-4 pt-6">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-akka-text-secondary text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold text-akka-text">{displayName}</h1>
      </div>

      {/* Streak card */}
      <Card className="mb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
          <Flame size={20} className="text-orange-500" />
        </div>
        <div>
          <p className="text-2xl font-bold text-akka-text">
            {streakDays} <span className="text-sm font-medium text-akka-text-secondary">days</span>
          </p>
          <p className="text-xs text-akka-text-secondary">Current streak</p>
        </div>
      </Card>

      {/* Level card */}
      <Card className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary">
            Level {level?.level}
          </p>
          <p className="text-xs font-semibold text-akka-green">{level?.name}</p>
        </div>
        <ProgressBar value={levelProgress} />
        <p className="text-xs text-akka-text-secondary mt-1.5">
          {totalXP.toLocaleString()} XP
          {nextLevel && <> / {nextLevel.xpRequired.toLocaleString()} XP</>}
        </p>
      </Card>

      {/* Investor Score placeholder */}
      <Card className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary mb-1">
          Investor Score
        </p>
        <p className="text-2xl font-bold text-akka-text">
          {profile.investor_score || 0}
          <span className="text-sm font-medium text-akka-text-secondary"> / 1000</span>
        </p>
      </Card>

      {/* CTA */}
      <Button
        variant="primary"
        className="w-full gap-2"
        onClick={() => navigate('/quiz')}
      >
        <Play size={18} />
        Start Quiz of the Day
      </Button>

      {/* Phase note */}
      <p className="text-center text-xs text-akka-text-secondary mt-8">
        Dashboard details coming in Phase 2
      </p>
    </div>
  )
}
