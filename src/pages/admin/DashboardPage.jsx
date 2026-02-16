import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import {
  LayoutDashboard,
  FileQuestion,
  CheckCircle,
  Clock,
  XCircle,
  Sparkles,
  Globe,
  TrendingUp,
  Zap,
} from 'lucide-react'

const STATUS_CONFIG = {
  completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  running: { color: 'bg-blue-100 text-blue-700', icon: Zap },
  failed: { color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      // Fetch all questions for stats
      const { data: questions } = await supabase
        .from('questions')
        .select('id, status, macro_category, source, question_fr, question_it, question_es')

      // Fetch recent batches
      const { data: batchData } = await supabase
        .from('ai_generation_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (questions) {
        const total = questions.length
        const approved = questions.filter((q) => q.status === 'approved').length
        const pending = questions.filter((q) => q.status === 'pending_review').length
        const rejected = questions.filter((q) => q.status === 'rejected').length

        // Count by category
        const byCategory = {}
        questions.forEach((q) => {
          byCategory[q.macro_category] = (byCategory[q.macro_category] || 0) + 1
        })

        // Count by source
        const aiCount = questions.filter((q) => q.source === 'ai').length
        const manualCount = questions.filter((q) => q.source === 'manual' || q.source === 'import').length

        // Language coverage
        const withFr = questions.filter((q) => q.question_fr).length
        const withIt = questions.filter((q) => q.question_it).length
        const withEs = questions.filter((q) => q.question_es).length

        setStats({
          total,
          approved,
          pending,
          rejected,
          byCategory,
          aiCount,
          manualCount,
          withFr,
          withIt,
          withEs,
        })
      }

      setBatches(batchData || [])
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">Overview of your question bank</p>
        </div>
        <button
          onClick={() => navigate('/admin/generate')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3D2F] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <Sparkles size={16} />
          Generate 5 Questions
        </button>
      </div>

      {/* Main stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileQuestion size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.total || 0}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Total Questions</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.approved || 0}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Approved</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.pending || 0}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Pending Review</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <XCircle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.rejected || 0}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Rejected</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Questions by Category */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#2ECC71]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Questions by Category
            </p>
          </div>
          <div className="space-y-3">
            {Object.entries(stats?.byCategory || {})
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => {
                const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#1A1A1A] truncate max-w-[280px]">{cat}</span>
                      <span className="text-sm font-semibold text-[#1A1A1A]">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-[#2ECC71] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>

        {/* Language Coverage + Source */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} className="text-[#3498DB]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Language Coverage
              </p>
            </div>
            <div className="space-y-3">
              {[
                { flag: '🇬🇧', label: 'English', count: stats?.total || 0 },
                { flag: '🇫🇷', label: 'French', count: stats?.withFr || 0 },
                { flag: '🇮🇹', label: 'Italian', count: stats?.withIt || 0 },
                { flag: '🇪🇸', label: 'Spanish', count: stats?.withEs || 0 },
              ].map(({ flag, label, count }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{flag}</span>
                    <span className="text-sm text-[#1A1A1A]">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1A1A1A]">
                    {count}/{stats?.total || 0}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-purple-500" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Source
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-xl font-bold text-purple-700">{stats?.aiCount || 0}</p>
                <p className="text-xs text-purple-600 font-medium">AI Generated</p>
              </div>
              <div className="flex-1 text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-xl font-bold text-blue-700">{stats?.manualCount || 0}</p>
                <p className="text-xs text-blue-600 font-medium">Manual / Import</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent AI Batches */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#2ECC71]" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Recent AI Batches
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/generate')}
            className="text-sm text-[#1B3D2F] font-medium hover:underline"
          >
            View All →
          </button>
        </div>

        {batches.length === 0 ? (
          <p className="text-sm text-[#6B7280] text-center py-8">
            No AI batches yet. Generate your first questions!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D1D5DB]">
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Mode</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Count</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Cost</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Date</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.completed
                  const StatusIcon = cfg.icon
                  return (
                    <tr key={b.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 px-3 capitalize">{b.mode}</td>
                      <td className="py-2.5 px-3">{b.generated_count || 0}/{b.requested_count}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          <StatusIcon size={12} />
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs">
                        ${Number(b.total_cost_usd || 0).toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-[#6B7280]">
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
