import { NavLink } from 'react-router-dom'
import { useLang } from '../../hooks/useLang'
import { useProfile } from '../../hooks/useProfile'

/**
 * Tabs configuration — 2 main tabs + conditional Admin.
 * Quiz merged into Home. Labels use i18n keys resolved inside the component.
 */
const TABS = [
  { to: '/', labelKey: 'home' },
  { to: '/challenge', labelKey: 'challenge' },
  { to: '/news', labelKey: 'news' },
]

/**
 * TabBar — iOS-style bottom navigation with 3 tabs (Home, News, Admin).
 * Active tab: dark akka-green text. Inactive: gray.
 * Touch targets: 44px minimum. White background, subtle top border.
 */
export default function TabBar() {
  const { t } = useLang()
  const { profile } = useProfile()

  const tabs = [...TABS]
  if (profile?.is_admin) {
    tabs.push({ to: '/admin', labelKey: 'admin' })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D1D5DB] pb-safe z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map(({ to, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[56px] min-w-[64px] py-1.5 transition-colors ${
                isActive
                  ? 'text-[#1B3D2F]'
                  : 'text-gray-400'
              }`
            }
          >
            <span className="text-xs font-medium">{t(labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
