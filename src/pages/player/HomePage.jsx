import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { LEVELS } from '../../config/levels'
import { BADGES, TIER_COLORS } from '../../config/badges'
import { seedTestQuiz, replayQuiz } from '../../lib/seedQuiz'
import Card from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import Button from '../../components/ui/Button'
import { Flame, Play, CheckCircle, Trophy, Sparkles, Loader2, RotateCcw } from 'lucide-react'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/**
 * HomePage — player dashboard showing profile summary and CTA.
 * Displays display_name, level, XP progress, streak with 7-day circles,
 * investor score, recent badges, and quiz CTA.
 */
export default function HomePage() {
  const { profile, level, levelProgress } = useProfile()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [quizPlayedToday, setQuizPlayedToday] = useState(false)
  const [recentBadges, setRecentBadges] = useState([])
  const [streakHistory, setStreakHistory] = useState([])
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState(null)
  const [replaying, setReplaying] = useState(false)
  const [replayResult, setReplayResult] = useState(null)

  // Check if quiz already played today + fetch recent badges + streak history
  useEffect(() => {
    if (!user) return

    async function loadHomeData() {
      const today = new Date().toISOString().split('T')[0]

      // Check for today's quiz session
      const { data: sessions } = await supabase
        .from('quiz_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('quiz_date', today)
        .limit(1)

      setQuizPlayedToday(sessions && sessions.length > 0)

      // Fetch recent badges (last 3)
      const { data: earnedBadges } = await supabase
        .from('badges_earned')
        .select('badge_key, earned_at')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(3)

      if (earnedBadges) {
        const badgeDetails = earnedBadges
          .map((eb) => {
            const badge = BADGES.find((b) => b.id === eb.badge_key)
            return badge ? { ...badge, earned_at: eb.earned_at } : null
          })
          .filter(Boolean)
        setRecentBadges(badgeDetails)
      }

      // Build 7-day streak history (6 days ago → today)
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toISOString().split('T')[0])
      }

      const { data: weekSessions } = await supabase
        .from('quiz_sessions')
        .select('quiz_date')
        .eq('user_id', user.id)
        .in('quiz_date', days)

      const playedDates = new Set((weekSessions || []).map((s) => s.quiz_date))
      const history = days.map((date) => {
        const jsDay = new Date(date + 'T12:00:00').getDay() // 0=Sun
        const idx = jsDay === 0 ? 6 : jsDay - 1 // Mon=0..Sun=6
        return {
          label: DAY_LABELS[idx],
          date,
          played: playedDates.has(date),
        }
      })
      setStreakHistory(history)
    }

    loadHomeData()
  }, [user])

  // Seed test quiz handler (dev only)
  async function handleSeed() {
    setSeeding(true)
    setSeedResult(null)
    const result = await seedTestQuiz()
    setSeedResult(result)
    setSeeding(false)
  }

  // Replay quiz handler — delete today's session/answers, re-seed, navigate to quiz
  async function handleReplay() {
    if (!user) return
    setReplaying(true)
    setReplayResult(null)
    try {
      const today = new Date().toISOString().split('T')[0]

      // 1. Delete today's quiz_answers for this user
      const { data: sessions } = await supabase
        .from('quiz_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('quiz_date', today)

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id)
        await supabase
          .from('quiz_answers')
          .delete()
          .in('session_id', sessionIds)

        // 2. Delete today's quiz_sessions for this user
        await supabase
          .from('quiz_sessions')
          .delete()
          .eq('user_id', user.id)
          .eq('quiz_date', today)
      }

      // 3. Re-seed quiz with random unique approved questions
      const result = await replayQuiz()
      if (!result.success) throw new Error(result.error)

      // 4. Update state and navigate
      setQuizPlayedToday(false)
      setReplayResult({ success: true })

      // Navigate to quiz after short delay
      setTimeout(() => navigate('/quiz'), 300)
    } catch (err) {
      console.error('Replay error:', err)
      setReplayResult({ success: false, error: err.message })
    } finally {
      setReplaying(false)
    }
  }

  if (!profile) return null

  const displayName = profile.display_name || 'Player'
  const totalXP = profile.total_xp || 0
  const streakDays = profile.current_streak || 0
  const nextLevel = level?.level < 10 ? LEVELS[level.level] : null

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-akka-text-secondary text-sm">Welcome back,</p>
        <h1 className="text-2xl font-bold text-akka-text">{displayName}</h1>
      </div>

      {/* Streak card with 7-day circles */}
      <Card className="mb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
            <Flame size={20} className="text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-akka-text">
              {streakDays}{' '}
              <span className="text-sm font-medium text-akka-text-secondary">days</span>
            </p>
            <p className="text-xs text-akka-text-secondary">Current streak</p>
          </div>
        </div>
        {/* 7-day circles */}
        {streakHistory.length > 0 && (
          <div className="flex items-center justify-between px-2">
            {streakHistory.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    day.played
                      ? 'bg-akka-green text-white'
                      : 'bg-gray-100 text-akka-text-secondary'
                  }`}
                >
                  {day.played ? '✓' : day.label}
                </div>
                <span className="text-[10px] text-akka-text-secondary">{day.label}</span>
              </div>
            ))}
          </div>
        )}
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

      {/* Investor Score */}
      <Card className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary mb-1">
          Investor Score
        </p>
        <p className="text-2xl font-bold text-akka-text">
          {profile.investor_score || 0}
          <span className="text-sm font-medium text-akka-text-secondary"> / 1000</span>
        </p>
      </Card>

      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <Card className="mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-amber-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary">
              Recent Badges
            </p>
          </div>
          <div className="flex gap-3">
            {recentBadges.map((badge) => {
              const colors = TIER_COLORS[badge.tier] || TIER_COLORS.common
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border ${colors.bg} ${colors.border}`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span className={`text-[10px] font-semibold ${colors.text}`}>
                    {badge.name}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* CTA */}
      {quizPlayedToday ? (
        <Button variant="outline" className="w-full gap-2 opacity-70" disabled>
          <CheckCircle size={18} className="text-akka-green" />
          Quiz Completed ✓
        </Button>
      ) : (
        <Button variant="primary" className="w-full gap-2" onClick={() => navigate('/quiz')}>
          <Play size={18} />
          Start Quiz of the Day
        </Button>
      )}

      {/* Dev tools */}
      <div className="mt-6 pt-4 border-t border-akka-border space-y-3">
        {/* Replay Quiz — deletes today's session, reseeds, navigates to quiz */}
        <Button
          variant="outline"
          className="w-full gap-2 text-sm"
          onClick={handleReplay}
          disabled={replaying || seeding}
        >
          {replaying ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RotateCcw size={16} />
          )}
          {replaying ? 'Resetting...' : 'Replay Quiz (Dev)'}
        </Button>
        {replayResult && !replayResult.success && (
          <p className="text-xs text-center text-akka-red">
            Error: {replayResult.error}
          </p>
        )}

        {/* Seed Test Quiz — creates quiz without deleting session */}
        <Button
          variant="outline"
          className="w-full gap-2 text-sm"
          onClick={handleSeed}
          disabled={seeding || replaying}
        >
          {seeding ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {seeding ? 'Seeding...' : 'Seed Test Quiz (Dev)'}
        </Button>
        {seedResult && (
          <p
            className={`text-xs text-center ${
              seedResult.success ? 'text-akka-green' : 'text-akka-red'
            }`}
          >
            {seedResult.success
              ? `Quiz seeded! ID: ${seedResult.quizId}`
              : `Error: ${seedResult.error}`}
          </p>
        )}
      </div>
    </div>
  )
}
