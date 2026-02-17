import { useState, useEffect } from 'react'
import { Trophy, Flame, Medal, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { useLang } from '../../hooks/useLang'

/**
 * LeaderboardPage — displays top players ranked by total XP.
 * Highlights the current user's position in the list.
 */
export default function LeaderboardPage() {
  const { t } = useLang()
  const { profile } = useProfile()
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, total_xp, level, current_streak')
        .order('total_xp', { ascending: false })
        .limit(50)
      if (!cancelled) {
        setLeaders(data || [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Medal colors for top 3
  const medalColor = ['text-amber-500', 'text-gray-400', 'text-orange-400']

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <h1 className="text-2xl font-bold text-akka-text mb-6">{t('ranking')}</h1>

      {/* Top 3 podium */}
      {!loading && leaders.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-8">
          {[1, 0, 2].map((idx) => {
            const user = leaders[idx]
            const isCenter = idx === 0
            return (
              <div key={user.id} className="flex flex-col items-center">
                <div
                  className={`relative ${isCenter ? 'w-18 h-18' : 'w-14 h-14'} rounded-full bg-gradient-to-br from-[#1B3D2F] to-[#2ECC71] flex items-center justify-center ${isCenter ? 'mb-2' : 'mb-1'}`}
                  style={isCenter ? { width: 72, height: 72 } : { width: 56, height: 56 }}
                >
                  <span className="text-white font-bold text-lg">
                    {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Medal size={14} className={medalColor[idx]} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-akka-text mt-1 text-center max-w-[80px] truncate">
                  {user.display_name}
                </p>
                <p className="text-[10px] text-akka-text-secondary font-medium">
                  {user.total_xp?.toLocaleString()} XP
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-6 h-6 border-2 border-[#1B3D2F] border-t-transparent rounded-full" />
        </div>
      )}

      {/* Full ranking list */}
      {!loading && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          {leaders.map((user, i) => {
            const isMe = user.id === profile?.id
            return (
              <div
                key={user.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i > 0 ? 'border-t border-[#F3F4F6]' : ''
                } ${isMe ? 'bg-[#F0FDF4]' : ''}`}
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {i < 3 ? (
                    <Medal size={18} className={medalColor[i]} />
                  ) : (
                    <span className="text-sm font-semibold text-akka-text-secondary">
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B3D2F] to-[#2ECC71] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>

                {/* Name + level */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isMe ? 'text-[#1B3D2F]' : 'text-akka-text'}`}>
                    {user.display_name}
                    {isMe && <span className="text-[10px] ml-1 text-[#2ECC71]">(you)</span>}
                  </p>
                  <p className="text-[11px] text-akka-text-secondary">
                    {t('level')} {user.level}
                    {user.current_streak > 0 && (
                      <span className="ml-2 inline-flex items-center gap-0.5">
                        <Flame size={11} className="text-orange-400" />
                        {user.current_streak}
                      </span>
                    )}
                  </p>
                </div>

                {/* XP */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-akka-text">
                    {user.total_xp?.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-akka-text-secondary">XP</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && leaders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Trophy size={32} className="text-amber-500 mb-3" />
          <p className="text-akka-text-secondary">{t('loading')}</p>
        </div>
      )}
    </div>
  )
}
