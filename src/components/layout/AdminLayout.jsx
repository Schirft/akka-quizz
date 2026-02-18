import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
  LayoutDashboard,
  FileQuestion,
  Sparkles,
  Calendar,
  Newspaper,
  ArrowLeft,
} from 'lucide-react'
import TabBar from './TabBar'

/**
 * AdminLayout — horizontal tab navigation for the back-office.
 * FIX 8b: dynamic counters on nav tabs.
 *  • Questions  → pending_review count badge
 *  • AI Generator → green pulsing dot when generating
 *  • Daily Quiz → unplanned-days count (next 7 days)
 */
export default function AdminLayout() {
  const navigate = useNavigate()

  const [pendingCount, setPendingCount] = useState(0)
  const [generating, setGenerating] = useState(!!window.__akka_generating)
  const [unplannedDays, setUnplannedDays] = useState(0)

  // ── Load counters ──
  const loadCounts = useCallback(async () => {
    // Pending questions count
    const { count: pc } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review')
    setPendingCount(pc || 0)

    // Unplanned days in next 7 days
    const today = new Date()
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      dates.push(d.toISOString().split('T')[0])
    }
    const { data: quizzes } = await supabase
      .from('daily_quizzes')
      .select('quiz_date')
      .in('quiz_date', dates)
    const planned = new Set((quizzes || []).map((q) => q.quiz_date))
    setUnplannedDays(dates.filter((d) => !planned.has(d)).length)
  }, [])

  useEffect(() => {
    loadCounts()
    // Refresh every 30s
    const iv = setInterval(loadCounts, 30000)
    return () => clearInterval(iv)
  }, [loadCounts])

  // ── Listen for generation state changes ──
  useEffect(() => {
    function onGenState() {
      setGenerating(!!window.__akka_generating)
    }
    window.addEventListener('akka-gen-state', onGenState)
    return () => window.removeEventListener('akka-gen-state', onGenState)
  }, [])

  // ── Nav items ──
  const NAV_ITEMS = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    {
      to: '/admin/questions',
      label: 'Questions',
      icon: FileQuestion,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      to: '/admin/generate',
      label: 'AI Generator',
      icon: Sparkles,
      dot: generating,
    },
    {
      to: '/admin/daily',
      label: 'Daily Quiz',
      icon: Calendar,
      badge: unplannedDays > 0 ? unplannedDays : null,
      badgeColor: 'amber',
    },
    {
      to: '/admin/news',
      label: 'News',
      icon: Newspaper,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top header */}
      <header className="bg-white border-b border-[#D1D5DB] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Title row */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1B3D2F] flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-lg font-bold text-[#1A1A1A]">akka.admin</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors min-h-[44px] px-3 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Quiz</span>
              <span className="sm:hidden">App</span>
            </button>
          </div>

          {/* Tab navigation */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end, badge, badgeColor, dot }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-[#1B3D2F] text-[#1B3D2F]'
                      : 'border-transparent text-[#6B7280] hover:text-[#1A1A1A] hover:border-gray-300'
                  }`
                }
              >
                <Icon size={16} />
                {label}

                {/* Numeric badge (pending count / unplanned days) */}
                {badge != null && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full leading-none ${
                      badgeColor === 'amber'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {badge}
                  </span>
                )}

                {/* Green pulsing dot (generating) */}
                {dot && (
                  <span className="relative flex h-2.5 w-2.5 ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ECC71] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2ECC71]" />
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom TabBar */}
      <TabBar />
    </div>
  )
}
