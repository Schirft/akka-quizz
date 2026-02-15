import { Outlet } from 'react-router-dom'
import TabBar from './TabBar'

/**
 * PlayerLayout — wraps player pages with bottom TabBar.
 * Content has bottom padding to account for the fixed tab bar.
 */
export default function PlayerLayout() {
  return (
    <div className="min-h-screen bg-akka-bg">
      {/* Page content — pb-20 accounts for the fixed bottom tab bar */}
      <main className="max-w-[480px] mx-auto pb-20">
        <Outlet />
      </main>

      <TabBar />
    </div>
  )
}
