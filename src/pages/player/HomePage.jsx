import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import { useAuth } from '../../hooks/useAuth'
import { useLang } from '../../hooks/useLang'
import { supabase } from '../../lib/supabase'
import { LEVELS } from '../../config/levels'
import { BADGES, TIER_COLORS } from '../../config/badges'
import { LANGUAGES } from '../../config/constants'
import { replayQuiz } from '../../lib/seedQuiz'
import Card from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import Button from '../../components/ui/Button'
import {
  Flame, Play, CheckCircle, Trophy, Loader2, RotateCcw,
  LogOut, Shield,
} from 'lucide-react'

const DAY_LABELS_I18N = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  it: ['L', 'M', 'M', 'G', 'V', 'S', 'D'],
  es: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
}

/**
 * HomePage — merged player dashboard + profile.
 * Shows greeting, streak, level, investor score, stats, badges, quiz CTA,
 * admin panel button, language selector, and sign out.
 */
export default function HomePage() {
  const { profile, level, levelProgress } = useProfile()
  const { user, signOut } = useAuth()
  const { lang, setLang, t } = useLang()
  const navigate = useNavigate()

  const [quizPlayedToday, setQuizPlayedToday] = useState(false)
  const [recentBadges, setRecentBadges] = useState([])
  const [streakHistory, setStreakHistory] = useState([])
  const [replaying, setReplaying] = useState(false)
  const [replayResult, setReplayResult] = useState(null)

  const dayLabels = DAY_LABELS_I18N[lang] || DAY_LABELS_I18N.en

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
          label: dayLabels[idx],
          date,
          played: playedDates.has(date),
        }
      })
      setStreakHistory(history)
    }

    loadHomeData()
  }, [user, dayLabels])

  // New Quiz handler — delete today's session/answers, re-seed, navigate to quiz
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

  // Sign out handler
  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Logout error:', err)
      navigate('/login', { replace: true })
    }
  }

  if (!profile) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const displayName = profile.display_name || 'Player'
  const totalXP = profile.total_xp || 0
  const streakDays = profile.current_streak || 0
  const nextLevel = level?.level < 10 ? LEVELS[level.level] : null

  // Compute stats
  const totalQuizzes = profile.total_quizzes || 0
  const totalCorrect = profile.total_correct || 0
  const totalQuestions = profile.total_questions || 0
  const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const avgScore = totalQuizzes > 0 ? (totalCorrect / totalQuizzes).toFixed(1) : '0'

  // Initials for avatar
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Greeting with avatar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#1B3D2F] flex items-center justify-center">
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
        <div className="flex-1">
          <p className="text-akka-text-secondary text-sm">{t('welcome_back')}</p>
          <h1 className="text-xl font-bold text-akka-text">{displayName}</h1>
        </div>
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
              <span className="text-sm font-medium text-akka-text-secondary">{t('days')}</span>
            </p>
            <p className="text-xs text-akka-text-secondary">{t('current_streak')}</p>
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

      {/* Level card — redesigned Akka style */}
      <Card className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1B3D2F] flex items-center justify-center">
              <span className="text-white text-xs font-bold">{level?.level}</span>
            </div>
            <p className="text-sm font-bold text-[#2ECC71]">{level?.name}</p>
          </div>
          <p className="text-sm font-bold text-akka-text tabular-nums">
            {totalXP.toLocaleString()} XP
          </p>
        </div>
        <ProgressBar value={levelProgress} />
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] text-akka-text-secondary">
            {t('level')} {level?.level}
          </p>
          {nextLevel && (
            <p className="text-[10px] text-akka-text-secondary">
              {nextLevel.xpRequired.toLocaleString()} XP → {t('level')} {nextLevel.level}
            </p>
          )}
        </div>
      </Card>

      {/* Stats — 3 pill cards with colors */}
      <div className="flex gap-2 mb-3">
        <Card className="flex-1 flex flex-col items-center py-3 px-2">
          <span className="text-base mb-0.5">📊</span>
          <p className="text-lg font-bold text-[#2ECC71]">{avgScore}</p>
          <p className="text-[10px] text-akka-text-secondary">{t('avg_score')}</p>
        </Card>
        <Card className="flex-1 flex flex-col items-center py-3 px-2">
          <span className="text-base mb-0.5">🎯</span>
          <p className="text-lg font-bold text-[#3498DB]">{accuracy}%</p>
          <p className="text-[10px] text-akka-text-secondary">{t('accuracy')}</p>
        </Card>
        <Card className="flex-1 flex flex-col items-center py-3 px-2">
          <span className="text-base mb-0.5">🏆</span>
          <p className="text-lg font-bold text-[#F39C12]">{profile.longest_streak || 0}</p>
          <p className="text-[10px] text-akka-text-secondary">{t('best_streak')}</p>
        </Card>
      </div>

      {/* Investor Score */}
      <Card className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary mb-1">
          {t('investor_score')}
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
              {t('recent_badges')}
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
          {t('quiz_completed')} ✓
        </Button>
      ) : (
        <Button variant="primary" className="w-full gap-2" onClick={() => navigate('/quiz')}>
          <Play size={18} />
          {t('start_quiz')}
        </Button>
      )}

      {/* Admin + Sign Out — visible real buttons */}
      <div className="mt-6 pt-4 border-t border-[#D1D5DB] space-y-3">
        <Button
          variant="primary"
          className="w-full gap-2"
          onClick={() => navigate('/admin')}
          style={{ backgroundColor: '#1B3D2F' }}
        >
          <Shield size={18} />
          {t('admin_panel')}
        </Button>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl border-2 border-[#E74C3C] text-[#E74C3C] font-semibold hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          {t('sign_out')}
        </button>
      </div>

      {/* Language selector */}
      <div className="mt-4 pt-4 border-t border-[#D1D5DB]">
        <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary mb-2 text-center">
          {t('language')}
        </p>
        <div className="flex items-center justify-center gap-2">
          {LANGUAGES.map(({ code, flag }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`text-lg px-2 py-1 rounded-lg transition-all ${
                lang === code
                  ? 'bg-gray-100 scale-110'
                  : 'opacity-50 hover:opacity-80'
              }`}
              title={code.toUpperCase()}
            >
              {flag}
            </button>
          ))}
        </div>
      </div>

      {/* Demo tools */}
      <div className="mt-4 pt-4 border-t border-[#D1D5DB] space-y-3">
        <Button
          variant="outline"
          className="w-full gap-2 text-sm"
          onClick={handleReplay}
          disabled={replaying}
        >
          {replaying ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RotateCcw size={16} />
          )}
          {replaying ? t('resetting') : `🔄 ${t('new_quiz_demo')}`}
        </Button>
        {replayResult && !replayResult.success && (
          <p className="text-xs text-center text-akka-red">
            Error: {replayResult.error}
          </p>
        )}
      </div>
    </div>
  )
}
