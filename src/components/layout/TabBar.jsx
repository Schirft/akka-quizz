import { NavLink } from 'react-router-dom'
import { House, Brain, Newspaper, Trophy, Settings } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

/**
 * Tabs configuration — 4 bottom navigation items (+ Admin for admins).
 */
const TABS = [
  { to: '/', label: 'Home', icon: House },
  { to: '/quiz', label: 'Quiz', icon: Brain },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/leaderboard', label: 'Ranking', icon: Trophy },
]

const ADMIN_TAB = { to: '/admin', label: 'Admin', icon: Settings }

/**
 * TabBar — iOS-style bottom navigation with 4 tabs (+ Admin for admin users).
 * Active tab: akka-green icon + text. Inactive: gray.
 * Touch targets: 44px minimum. White background, subtle top border.
 */
export default function TabBar() {
  const { profile } = useAuth()
  const isAdmin = profile?.is_admin === true

  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D1D5DB] pb-safe z-50">
      <div className="flex items-center justify-around max-w-[480px] mx-auto">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[56px] min-w-[64px] py-1.5 transition-colors ${
                isActive
                  ? 'text-akka-green'
                  : 'text-gray-400'
              }`
            }
          >
            <Icon size={22} strokeWidth={2} />
            <span className="text-[10px] font-medium mt-0.5">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
