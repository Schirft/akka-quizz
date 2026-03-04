import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

/**
 * ProfilePage — shows user info, stats placeholder, and admin/logout actions.
 */
export default function ProfilePage() {
  const { signOut } = useAuth()
  const { profile, level } = useProfile()
  const navigate = useNavigate()

  if (!profile) return null

  const displayName = profile.display_name || 'Player'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Logout error:', err)
      // Force redirect even on error to avoid stale state
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-akka-text mb-6">Profile</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-akka-dark flex items-center justify-center">
          <span className="text-white text-lg font-bold">{initials}</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-akka-text">{displayName}</h2>
          <p className="text-sm text-akka-green font-medium">
            Level {level?.level} — {level?.name}
          </p>
        </div>
      </div>

      {/* Stats placeholder */}
      <Card className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary mb-3">
          Stats
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-lg font-bold text-akka-text">{profile.quizzes_completed || 0}</p>
            <p className="text-xs text-akka-text-secondary">Quizzes</p>
          </div>
          <div>
            <p className="text-lg font-bold text-akka-text">{profile.accuracy ? `${Math.round(profile.accuracy * 100)}%` : '0%'}</p>
            <p className="text-xs text-akka-text-secondary">Accuracy</p>
          </div>
          <div>
            <p className="text-lg font-bold text-akka-text">{profile.longest_streak || 0}</p>
            <p className="text-xs text-akka-text-secondary">Best Streak</p>
          </div>
          <div>
            <p className="text-lg font-bold text-akka-text">{(profile.total_xp || 0).toLocaleString()}</p>
            <p className="text-xs text-akka-text-secondary">Total XP</p>
          </div>
        </div>
      </Card>

      {/* Badges placeholder */}
      <Card className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary mb-2">
          Badges
        </p>
        <p className="text-sm text-akka-text-secondary">
          Badge collection coming in Phase 3
        </p>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => navigate('/admin')}
        >
          Admin Panel
        </Button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 text-akka-red font-medium py-3 min-h-[44px] rounded-xl hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
      </div>

      <p className="text-center text-xs text-akka-text-secondary mt-8">
        Full profile coming in Phase 3
      </p>
    </div>
  )
}
