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
import Button from '../../components/ui/Button'
import WeeklyRecapModal from '../../components/player/WeeklyRecapModal'
import ProgressionPathModal from '../../components/player/ProgressionPathModal'
import {
  Flame, CheckCircle, Trophy, Loader2, RotateCcw,
  LogOut, Shield, Medal, ChevronRight,
} from 'lucide-react'

const LEVEL_EMOJIS = {
  1: '🌱', 2: '📚', 3: '💰', 4: '📊', 5: '👼',
  6: '♟️', 7: '🎯', 8: '🔮', 9: '⭐', 10: '🐋',
}

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
  const [leaders, setLeaders] = useState([])
  const [showScoreTooltip, setShowScoreTooltip] = useState(false)
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false)
  const [showProgression, setShowProgression] = useState(false)

  const dayLabels = DAY_LABELS_I18N[lang] || DAY_LABELS_I18N.en

  // Weekly recap modal — show on Mondays
  useEffect(() => {
    const now = new Date()
    const isMonday = now.getDay() === 1
    const lastShown = localStorage.getItem('akka_weekly_recap_shown')
    const lastDate = lastShown ? new Date(lastShown) : null

    if (isMonday && (!lastDate || (now - lastDate) > 6 * 24 * 60 * 60 * 1000)) {
      setTimeout(() => setShowWeeklyRecap(true), 1000)
      localStorage.setItem('akka_weekly_recap_shown', now.toISOString())
    }
  }, [])

  // Check if quiz already played today + fetch recent badges + streak history
  useEffect(() => {
    if (!user) return

    async function loadHomeData() {
      try {
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

        // Build current week Mon→Sun
        const nowDate = new Date()
        const jsDay = nowDate.getDay() // 0=Sun
        const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay
        const days = []
        for (let i = 0; i < 7; i++) {
          const d = new Date(nowDate)
          d.setDate(nowDate.getDate() + mondayOffset + i)
          days.push(d.toISOString().split('T')[0])
        }

        const { data: weekSessions } = await supabase
          .from('quiz_sessions')
          .select('quiz_date')
          .eq('user_id', user.id)
          .in('quiz_date', days)

        const playedDates = new Set((weekSessions || []).map((s) => s.quiz_date))
        const history = days.map((date, idx) => ({
          label: dayLabels[idx],
          date,
          dayOfMonth: parseInt(date.split('-')[2], 10),
          played: playedDates.has(date),
          isToday: date === today,
          isFuture: date > today,
        }))
        setStreakHistory(history)

        // Fetch top 10 for leaderboard
        const { data: topPlayers } = await supabase
          .from('profiles')
          .select('id, display_name, total_xp, level, current_streak')
          .order('total_xp', { ascending: false })
          .limit(10)
        setLeaders(topPlayers || [])
      } catch (err) {
        if (err?.name !== 'AbortError') console.error('Home data load error:', err)
      }
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
      <div className="w-8 h-8 border-4 border-[#1B3D2F] border-t-transparent rounded-full animate-spin" />
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
    <div className="px-4 pt-6 pb-4 bg-[#F8F9FA] min-h-screen">
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

      {/* Quiz of the Day card */}
      <div
        onClick={() => navigate(quizPlayedToday ? '/quiz' : '/quiz')}
        className="mb-3 p-4 rounded-2xl bg-[#1B3D2F] text-white cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/20 flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
            <div>
              <p className="font-bold text-base">{t('quiz_of_the_day')}</p>
              <p className="text-xs text-white/60">{t('questions_duration')}</p>
            </div>
          </div>
          {quizPlayedToday ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10">
              <CheckCircle size={14} className="text-[#2ECC71]" />
              <span className="text-xs font-semibold text-[#2ECC71]">{t('completed')}</span>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/quiz') }}
              className="px-4 py-2 rounded-xl bg-[#2ECC71] text-white text-sm font-bold active:scale-95 transition-transform"
            >
              {t('start_quiz_short')}
            </button>
          )}
        </div>
        {quizPlayedToday && streakDays > 0 && (
          <p className="text-xs text-white/50 mt-2">
            🔥 {t('keep_streak')}
          </p>
        )}
      </div>

      {/* Streak card with 7-day circles + fire animation (B7) */}
      <Card className="mb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            streakDays > 0 ? 'bg-orange-100 animate-streak-glow' : 'bg-orange-50'
          }`}>
            <Flame size={20} className={`${streakDays > 0 ? 'text-orange-500 animate-streak-fire' : 'text-orange-300'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-akka-text">
              {streakDays}{' '}
              <span className="text-sm font-medium text-akka-text-secondary">{t('days')}</span>
            </p>
            <p className="text-xs text-akka-text-secondary">{t('current_streak')}</p>
          </div>
        </div>
        {/* Weekly calendar Mon→Sun */}
        {streakHistory.length > 0 && (
          <div className="flex items-center justify-between px-1">
            {streakHistory.map((day, i) => {
              const circleStyle = day.played
                ? 'bg-akka-green text-white'
                : day.isFuture
                  ? 'bg-gray-50 text-gray-300'
                  : 'bg-gray-100 text-akka-text-secondary'
              const ringStyle = day.isToday ? 'ring-2 ring-[#1B3D2F] ring-offset-2' : ''
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-semibold ${day.isToday ? 'text-[#1B3D2F]' : 'text-akka-text-secondary'}`}>{day.label}</span>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${circleStyle} ${ringStyle}`}
                  >
                    {day.played ? '✓' : day.dayOfMonth}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Level & Progression card — game-like, dark themed, clickable */}
      <div
        onClick={() => setShowProgression(true)}
        className="mb-3 relative overflow-hidden rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-all shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1B3D2F 0%, #234E3B 50%, #1B3D2F 100%)' }}
      >
        {/* Subtle radial glow behind emoji */}
        <div
          className="absolute top-1 left-3 w-20 h-20 rounded-full opacity-20 blur-xl pointer-events-none"
          style={{ background: '#2ECC71' }}
        />
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-3">
              {/* Level badge with emoji */}
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shadow-inner">
                <span className="text-2xl">{LEVEL_EMOJIS[level?.level] || '🌱'}</span>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">
                  {t('level')} {level?.level}
                </p>
                <p className="text-base font-bold text-white">{level?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-white tabular-nums">
                {totalXP.toLocaleString()}
              </p>
              <p className="text-[10px] text-white/40 uppercase font-semibold">XP</p>
            </div>
          </div>

          {/* XP progress bar with glow */}
          <div className="relative h-[10px] w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2ECC71] to-[#27AE60] transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(Math.max(levelProgress, 0), 1) * 100}%`,
                boxShadow: '0 0 8px rgba(46,204,113,0.4)',
              }}
            />
          </div>

          {/* Bottom row: XP to next + CTA */}
          <div className="flex items-center justify-between mt-2">
            {nextLevel ? (
              <p className="text-[10px] text-white/35 tabular-nums">
                {(nextLevel.xpRequired - totalXP).toLocaleString()} XP → {t('level')} {nextLevel.level}
              </p>
            ) : (
              <p className="text-[10px] text-white/35">🏆 Max level!</p>
            )}
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
              <p className="text-[10px] font-semibold text-white/70">
                {t('see_journey')}
              </p>
              <ChevronRight size={12} className="text-white/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats — 3 pill cards with colored icon backgrounds */}
      <div className="flex gap-2 mb-3">
        <Card className="flex-1 flex flex-col items-center py-3 px-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-1">
            <span className="text-xl">📊</span>
          </div>
          <p className="text-xl font-bold text-[#1B3D2F]">{avgScore}</p>
          <p className="text-[10px] text-akka-text-secondary">{t('avg_score')}</p>
        </Card>
        <Card className="flex-1 flex flex-col items-center py-3 px-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1">
            <span className="text-xl">🎯</span>
          </div>
          <p className="text-xl font-bold text-[#1B3D2F]">{accuracy}%</p>
          <p className="text-[10px] text-akka-text-secondary">{t('accuracy')}</p>
        </Card>
        <Card className="flex-1 flex flex-col items-center py-3 px-2">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-1">
            <span className="text-xl">🏆</span>
          </div>
          <p className="text-xl font-bold text-[#1B3D2F]">{profile.longest_streak || 0}</p>
          <p className="text-[10px] text-akka-text-secondary">{t('best_streak')}</p>
        </Card>
      </div>

      {/* Investor Score — circular SVG gauge */}
      <Card className="mb-3">
        <div className="flex items-center gap-4">
          {/* SVG circular gauge */}
          {(() => {
            const score = profile.investor_score || 0
            const max = 1000
            const pct = Math.min(score / max, 1)
            const r = 40
            const circumference = 2 * Math.PI * r
            const offset = circumference * (1 - pct)
            const gaugeColor = pct >= 0.7 ? '#1B3D2F' : pct >= 0.4 ? '#F39C12' : '#E74C3C'
            return (
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r={r} fill="none"
                    stroke={gaugeColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-[#1B3D2F]">{score}</span>
                  <span className="text-[9px] text-akka-text-secondary">/ {max}</span>
                </div>
              </div>
            )
          })()}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-[#1B3D2F] uppercase tracking-wide">
                {t('investor_score')}
              </p>
              <button
                onClick={() => setShowScoreTooltip(!showScoreTooltip)}
                className="text-gray-400 hover:text-gray-600"
              >
                ℹ️
              </button>
            </div>
            <p className="text-sm font-semibold leading-snug">
              {(profile.investor_score || 0) >= 700
                ? <span className="text-[#1B3D2F]">🟢 {t('score_excellent')}</span>
                : (profile.investor_score || 0) >= 400
                  ? <span className="text-[#F39C12]">🟡 {t('score_good')}</span>
                  : <span className="text-[#E74C3C]">🔴 {t('score_improving')}</span>}
            </p>
          </div>
        </div>
        {showScoreTooltip && (
          <div className="mt-3 bg-[#1B3D2F] text-white text-xs rounded-xl p-3 leading-relaxed">
            {t('score_tooltip_text') || 'Your Investor Score reflects your learning progress: quiz accuracy, streak consistency, XP earned, and overall engagement. Max 1000.'}
          </div>
        )}
      </Card>

      {/* Leaderboard */}
      {leaders.length > 0 && (
        <Card className="mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-amber-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary">
              {t('ranking')}
            </p>
          </div>
          <div className="space-y-0">
            {(() => {
              const myIndex = leaders.findIndex(l => l.id === profile?.id)
              const medalColors = ['text-amber-500', 'text-gray-400', 'text-orange-400']
              const medalBg = ['bg-amber-50', 'bg-gray-50', 'bg-orange-50']
              return leaders.map((leader, i) => {
                const isMe = leader.id === profile?.id
                return (
                  <div
                    key={leader.id}
                    className={`flex items-center gap-2.5 py-2 px-2 rounded-lg ${
                      isMe ? 'bg-[#1B3D2F]/10' : ''
                    } ${i < 3 ? medalBg[i] + ' mb-0.5' : ''}`}
                  >
                    <div className="w-6 text-center flex-shrink-0">
                      {i < 3 ? (
                        <Medal size={16} className={medalColors[i]} />
                      ) : (
                        <span className="text-xs font-semibold text-akka-text-secondary">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isMe ? 'text-[#1B3D2F] font-semibold' : 'text-akka-text'}`}>
                        {isMe && <span className="text-[#1B3D2F] mr-1">★</span>}
                        {leader.display_name}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-akka-text tabular-nums flex-shrink-0">
                      {leader.total_xp?.toLocaleString()} <span className="text-[10px] font-medium text-akka-text-secondary">XP</span>
                    </p>
                  </div>
                )
              })
            })()}
            {/* Show user position if not in top 10 */}
            {profile && !leaders.find(l => l.id === profile.id) && (
              <div className="flex items-center gap-2.5 py-2 px-2 rounded-lg bg-[#1B3D2F]/10 mt-1 border-t border-gray-100">
                <div className="w-6 text-center flex-shrink-0">
                  <span className="text-xs font-semibold text-akka-text-secondary">…</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1B3D2F] truncate">
                    <span className="text-[#1B3D2F] mr-1">★</span>
                    {displayName}
                  </p>
                </div>
                <p className="text-sm font-bold text-akka-text tabular-nums flex-shrink-0">
                  {totalXP.toLocaleString()} <span className="text-[10px] font-medium text-akka-text-secondary">XP</span>
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

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

      {/* Showcase link */}
      <Card className="mb-3 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate('/showcase')}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1B3D2F] to-[#2ECC71] flex items-center justify-center">
            <span className="text-2xl">🎓</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#1B3D2F]">Showcase</p>
            <p className="text-[11px] text-akka-text-secondary">15 demo packs — try the full experience</p>
          </div>
          <span className="text-gray-400 text-lg">›</span>
        </div>
      </Card>

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

      {/* Weekly Recap Modal */}
      {showWeeklyRecap && (
        <WeeklyRecapModal
          profile={profile}
          lang={lang}
          onClose={() => setShowWeeklyRecap(false)}
        />
      )}

      {/* Progression Path Modal */}
      <ProgressionPathModal
        open={showProgression}
        onClose={() => setShowProgression(false)}
        currentLevel={level}
        totalXP={totalXP}
      />
    </div>
  )
}
