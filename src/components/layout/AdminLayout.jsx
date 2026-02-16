import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileQuestion,
  Sparkles,
  Calendar,
  ArrowLeft,
} from 'lucide-react'

/**
 * Admin navigation tabs — 4 main sections.
 */
const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/questions', label: 'Questions', icon: FileQuestion },
  { to: '/admin/generate', label: 'AI Generator', icon: Sparkles },
  { to: '/admin/daily', label: 'Daily Quiz', icon: Calendar },
]

/**
 * AdminLayout — horizontal tab navigation for the back-office.
 * Desktop-optimized with responsive mobile support.
 */
export default function AdminLayout() {
  const navigate = useNavigate()

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
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-[#1B3D2F] text-[#1B3D2F]'
                      : 'border-transparent text-[#6B7280] hover:text-[#1A1A1A] hover:border-gray-300'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  )
}
