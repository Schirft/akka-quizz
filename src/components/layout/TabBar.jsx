import { NavLink } from 'react-router-dom'
import { House, Brain, Newspaper, Trophy, User } from 'lucide-react'

/**
 * Tabs configuration — 5 bottom navigation items.
 */
const TABS = [
  { to: '/', label: 'Home', icon: House },
  { to: '/quiz', label: 'Quiz', icon: Brain },
  { to: '/news', label: 'News', icon: Newspaper },
  { to: '/leaderboard', label: 'Ranking', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User },
]

/**
 * TabBar — iOS-style bottom navigation with 5 tabs.
 * Active tab: akka-green icon + text. Inactive: gray.
 * Touch targets: 44px minimum. White background, subtle top border.
 */
export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-akka-border pb-safe z-50">
      <div className="flex items-center justify-around max-w-[480px] mx-auto">
        {TABS.map(({ to, label, icon: Icon }) => (
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
