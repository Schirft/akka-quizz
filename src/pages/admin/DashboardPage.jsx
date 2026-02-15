import { LayoutDashboard } from 'lucide-react'
import Card from '../../components/ui/Card'

/**
 * DashboardPage — admin dashboard placeholder with stats cards.
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-akka-text mb-6">Admin Dashboard</h1>

      {/* Stats grid placeholder */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Questions', value: '—' },
          { label: 'Approved', value: '—' },
          { label: 'Pending Review', value: '—' },
          { label: 'AI Generated', value: '—' },
        ].map(({ label, value }) => (
          <Card key={label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-akka-text">{value}</p>
          </Card>
        ))}
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
          <LayoutDashboard size={32} className="text-akka-green" />
        </div>
        <p className="text-akka-text-secondary text-center">
          Full admin dashboard with charts and activity log.
        </p>
        <p className="text-sm text-akka-text-secondary mt-2">Coming in Phase 2</p>
      </div>
    </div>
  )
}
