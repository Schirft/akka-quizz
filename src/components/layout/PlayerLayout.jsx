import { Outlet } from 'react-router-dom'
import TabBar from './TabBar'

/**
 * PlayerLayout — wraps player pages with bottom TabBar.
 * Content has bottom padding to account for the fixed tab bar.
 */
export default function PlayerLayout() {
  return (
    <div className="min-h-screen bg-[#E5E7EB] md:bg-[#E5E7EB]">
      <div className="max-w-md mx-auto bg-[#F8F9FA] min-h-screen shadow-xl relative">
        {/* Page content — pb-20 accounts for the fixed bottom tab bar */}
        <main className="pb-20">
          <Outlet />
        </main>

        <TabBar />
      </div>
    </div>
  )
}
