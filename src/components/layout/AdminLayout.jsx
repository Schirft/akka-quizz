import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileQuestion,
  Sparkles,
  CheckCircle,
  Calendar,
  Upload,
  ArrowLeft,
} from 'lucide-react'

/**
 * Admin sidebar navigation items.
 */
const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/questions', label: 'Questions', icon: FileQuestion },
  { to: '/admin/generate', label: 'AI Generate', icon: Sparkles },
  { to: '/admin/review', label: 'AI Review', icon: CheckCircle },
  { to: '/admin/daily-quiz', label: 'Daily Quiz', icon: Calendar },
  { to: '/admin/import', label: 'Import/Export', icon: Upload },
]

/**
 * AdminLayout — sidebar navigation for the back-office.
 * On mobile: top header with hamburger menu (simplified for Phase 1).
 * On desktop: persistent left sidebar.
 */
export default function AdminLayout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Sidebar — visible on desktop, hidden on mobile (shown as top nav) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-white border-r border-akka-border">
        <div className="p-4 border-b border-akka-border">
          <h2 className="text-lg font-bold text-akka-text">akka.admin</h2>
        </div>
        <nav className="flex-1 p-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-akka-green'
                    : 'text-akka-text-secondary hover:bg-gray-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-akka-border">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-akka-text-secondary hover:text-akka-text w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to App
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden bg-white border-b border-akka-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-bold text-akka-text">akka.admin</h2>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-akka-text-secondary min-h-[44px]"
          >
            <ArrowLeft size={16} />
            App
          </button>
        </div>
        {/* Horizontal scroll nav on mobile */}
        <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap min-h-[36px] transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-akka-green'
                    : 'text-akka-text-secondary'
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
