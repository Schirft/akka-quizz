import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import { Loader2 } from 'lucide-react'

const STATUS_CONFIG = {
  completed: { color: 'bg-green-100 text-green-700', icon: null },
  running: { color: 'bg-blue-100 text-blue-700', icon: null },
  failed: { color: 'bg-red-100 text-red-700', icon: null },
}

// E4: Category normalization map
const CATEGORY_NORMALIZE = {
  'fundraising': 'Fundraising',
  'Fundraising': 'Fundraising',
  'cap_tables': 'Cap Tables',
  'Cap Tables': 'Cap Tables',
  'term_sheets': 'Term Sheets',
  'Term Sheets': 'Term Sheets',
  'unit_economics': 'Unit Economics',
  'Unit Economics': 'Unit Economics',
  'revenue_growth': 'Revenue & Growth',
  'Revenue & Growth': 'Revenue & Growth',
  'burn_analysis': 'Burn Analysis',
  'Burn Analysis': 'Burn Analysis',
  'market_comps': 'Market & Comps',
  'Market & Comps': 'Market & Comps',
  'startup_valuation': 'Startup Valuation',
  'Startup Valuation': 'Startup Valuation',
  'due_diligence': 'Due Diligence',
  'Due Diligence': 'Due Diligence',
  'exit_strategies': 'Exit Strategies',
  'Exit Strategies': 'Exit Strategies',
}

function normalizeCategory(cat) {
  if (!cat) return 'Unknown'
  return CATEGORY_NORMALIZE[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [batches, setBatches] = useState([])
  const [packs, setPacks] = useState([])
  const [packHealth, setPackHealth] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [now, setNow] = useState(new Date())

  // Live clock — tick every 60s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  const [seedResult, setSeedResult] = useState(null)
  const [seedStatus, setSeedStatus] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      // Fetch all questions for stats
      const { data: questions } = await supabase
        .from('questions')
        .select('id, status, macro_category, source, question_fr, question_it, question_es')

      // Fetch packs count
      const { count: packCount } = await supabase
        .from('daily_packs')
        .select('*', { count: 'exact', head: true })

      // Fetch puzzles count
      const { count: puzzleCount } = await supabase
        .from('puzzles')
        .select('*', { count: 'exact', head: true })

      // Fetch lessons count
      const { count: lessonCount } = await supabase
        .from('daily_lessons')
        .select('*', { count: 'exact', head: true })

      // E5: Fetch recent packs (replacing batches)
      const { data: packData } = await supabase
        .from('daily_packs')
        .select('id, theme, difficulty, status, question_ids, puzzle_id, lesson_id, assigned_date, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      // E2: Pack Health — next 14 days
      const today = new Date()
      const healthDays = []
      for (let d = 0; d < 14; d++) {
        const date = new Date(today)
        date.setDate(today.getDate() + d)
        const dateStr = date.toISOString().split('T')[0]
        healthDays.push({ date: dateStr, label: date.toLocaleDateString('en', { weekday: 'short', day: 'numeric' }), packs: [] })
      }

      // Fetch assigned packs for next 14 days
      const futureDate = new Date(today)
      futureDate.setDate(today.getDate() + 14)
      const { data: assignedPacks } = await supabase
        .from('daily_packs')
        .select('id, theme, assigned_date, status')
        .gte('assigned_date', today.toISOString().split('T')[0])
        .lte('assigned_date', futureDate.toISOString().split('T')[0])

      if (assignedPacks) {
        for (const pack of assignedPacks) {
          const day = healthDays.find(d => d.date === pack.assigned_date)
          if (day) day.packs.push(pack)
        }
      }
      setPackHealth(healthDays)

      // E3: API cost — fetch batches for monthly cost
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const { data: monthBatches } = await supabase
        .from('ai_generation_batches')
        .select('total_cost_usd')
        .gte('created_at', monthStart)

      const monthlyCost = (monthBatches || []).reduce((sum, b) => sum + (b.total_cost_usd || 0), 0)
      // Estimate pack costs: ~$0.06 per pack (4 API calls)
      const packApiCost = (packData?.length || 0) * 0.06

      if (questions) {
        const total = questions.length
        const approved = questions.filter((q) => q.status === 'approved').length
        const pending = questions.filter((q) => q.status === 'pending_review').length
        const rejected = questions.filter((q) => q.status === 'rejected').length

        // E4: Count by category with normalization
        const byCategory = {}
        questions.forEach((q) => {
          const normalized = normalizeCategory(q.macro_category)
          byCategory[normalized] = (byCategory[normalized] || 0) + 1
        })

        // Count by source — E1: pack vs orphan
        const aiCount = questions.filter((q) => q.source === 'ai').length
        const packCount2 = questions.filter((q) => q.source === 'ai_daily_pack').length
        const manualCount = questions.filter((q) => q.source === 'manual' || q.source === 'import').length

        // Language coverage
        const withFr = questions.filter((q) => q.question_fr).length
        const withIt = questions.filter((q) => q.question_it).length
        const withEs = questions.filter((q) => q.question_es).length

        setStats({
          total, approved, pending, rejected,
          byCategory, aiCount, packCount2, manualCount,
          withFr, withIt, withEs,
          totalPacks: packCount || 0,
          totalPuzzles: puzzleCount || 0,
          totalLessons: lessonCount || 0,
          monthlyCost: monthlyCost + packApiCost,
        })
      }

      setPacks(packData || [])
    } catch (err) {
      if (err?.name !== 'AbortError') console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Seed test news articles from GNews API
   */
  async function seedTestArticles() {
    setSeeding(true)
    setSeedResult(null)
    setSeedStatus('')

    const GNEWS_KEY = '53798e3ace1583384a27a73cdfb2bd19'
    const langs = ['en', 'fr', 'it', 'es']
    const categories = [
      { cat: 'startup', queries: { en: 'startup funding series A', fr: 'startup levée de fonds', it: 'startup finanziamento', es: 'startup financiación' } },
      { cat: 'ai', queries: { en: 'artificial intelligence startup', fr: 'intelligence artificielle startup', it: 'intelligenza artificiale startup', es: 'inteligencia artificial startup' } },
      { cat: 'vc', queries: { en: 'venture capital private equity', fr: 'capital risque investissement', it: 'venture capital private equity', es: 'capital riesgo privado' } },
      { cat: 'crypto', queries: { en: 'startup IPO acquisition unicorn', fr: 'startup IPO acquisition licorne', it: 'startup IPO acquisizione unicorno', es: 'startup IPO adquisición unicornio' } },
      { cat: 'markets', queries: { en: 'stock market IPO economy', fr: 'bourse IPO économie marchés', it: 'borsa IPO economia mercati', es: 'bolsa IPO economía mercados' } },
      { cat: 'fintech', queries: { en: 'fintech startup funding', fr: 'fintech startup banque', it: 'fintech startup banca', es: 'fintech startup banco' } },
    ]

    let inserted = 0
    let errors = 0

    for (const lang of langs) {
      for (const { cat, queries } of categories) {
        const label = `${lang.toUpperCase()} — ${cat}`
        setSeedStatus(`Seeding ${label}...`)
        try {
          const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(queries[lang])}&lang=${lang}&max=3&apikey=${GNEWS_KEY}`
          const res = await fetch(url)
          if (!res.ok) { errors++; continue }
          const data = await res.json()

          for (const article of (data.articles || [])) {
            const payload = {
              title: article.title, description: article.description || null,
              content: article.content || null, source_name: article.source?.name || null,
              source_url: article.url, image_url: article.image || null,
              language: lang, category: cat,
              published_at: article.publishedAt || new Date().toISOString(),
              is_active: true, is_featured: false,
            }
            const { error: uErr } = await supabase
              .from('news_articles')
              .upsert(payload, { onConflict: 'source_url', ignoreDuplicates: true })
            if (!uErr) inserted++
            else errors++
          }
        } catch { errors++ }
        await new Promise((r) => setTimeout(r, 1100))
      }
    }

    for (const lang of langs) {
      const { data: latest } = await supabase
        .from('news_articles')
        .select('id')
        .eq('language', lang)
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .single()
      if (latest) {
        await supabase.from('news_articles').update({ is_featured: true }).eq('id', latest.id)
      }
    }

    setSeedStatus('')
    setSeedResult({ inserted, errors })
    setSeeding(false)
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
          <p className="text-sm text-[#6B7280] mt-1">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={seedTestArticles} disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#D1D5DB] text-[#1A1A1A] text-sm font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            {seeding && <Loader2 size={16} className="animate-spin" />}
            {seeding ? (seedStatus || 'Seeding...') : 'Seed Test News'}
          </button>
          <button onClick={() => navigate('/admin/generate')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3D2F] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Generate
          </button>
        </div>
      </div>

      {seedResult && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <p className="text-sm text-emerald-700 font-medium">
            Seeded {seedResult.inserted} articles{seedResult.errors > 0 ? ` (${seedResult.errors} errors)` : ''}
          </p>
          <button onClick={() => setSeedResult(null)} className="text-xs text-emerald-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* E1: Enhanced stats row — Questions + Packs + Puzzles + Lessons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card>
          <div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.total || 0}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Total Questions</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.totalPacks || 0}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Packs</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.totalPuzzles || 0}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Puzzles</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.totalLessons || 0}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Lessons</p>
          </div>
        </Card>
      </div>

      {/* Second row: Approved / Pending / Rejected / Questions source */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.approved || 0}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Approved</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.pending || 0}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Pending</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{stats?.rejected || 0}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Rejected</p>
          </div>
        </Card>
        {/* E1: Pack vs Orphan questions */}
        <Card>
          <div>
            <p className="text-lg font-bold text-[#1A1A1A]">
              <span className="text-emerald-600">{stats?.packCount2 || 0}</span>
              <span className="text-[#6B7280] text-sm font-normal"> / </span>
              <span className="text-purple-600">{stats?.aiCount || 0}</span>
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Pack / AI Orphan</p>
          </div>
        </Card>
      </div>

      {/* E2: Pack Health Calendar — 14 days ahead */}
      <Card className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-4">
          Pack Health — Next 14 Days
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {packHealth.map((day, i) => {
            const hasPack = day.packs.length > 0
            const isToday = i === 0
            return (
              <div
                key={day.date}
                className={`flex-shrink-0 w-16 text-center rounded-xl p-2 border transition-all ${
                  hasPack
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                } ${isToday ? 'ring-2 ring-[#1B3D2F]' : ''}`}
                title={`${day.date}: ${hasPack ? day.packs.length + ' pack(s)' : 'No pack assigned'}`}
              >
                <p className={`text-[10px] font-semibold uppercase ${isToday ? 'text-[#1B3D2F]' : 'text-[#6B7280]'}`}>
                  {day.label}
                </p>
                <div className="mt-1 text-center text-sm">
                  {hasPack ? (
                    <span className="text-emerald-500">&#10003;</span>
                  ) : (
                    <span className="text-red-400">!</span>
                  )}
                </div>
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  {hasPack ? `${day.packs.length}` : '0'}
                </p>
              </div>
            )
          })}
        </div>
        {packHealth.filter(d => d.packs.length === 0).length > 0 && (
          <p className="text-xs text-red-600 mt-2">
            <span className="inline mr-1">!</span>
            {packHealth.filter(d => d.packs.length === 0).length} days without assigned packs
          </p>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* E4: Questions by Category (normalized) */}
        <Card className="lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-4">
            Questions by Category
          </p>
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

        {/* Right column: Language + Source + Cost */}
        <div className="space-y-6">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-4">Language Coverage</p>
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
                  <span className="text-sm font-semibold text-[#1A1A1A]">{count}/{stats?.total || 0}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-4">Source</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center p-3 bg-emerald-50 rounded-xl">
                <p className="text-xl font-bold text-emerald-700">{stats?.packCount2 || 0}</p>
                <p className="text-xs text-emerald-600 font-medium">Pack</p>
              </div>
              <div className="flex-1 text-center p-3 bg-purple-50 rounded-xl">
                <p className="text-xl font-bold text-purple-700">{stats?.aiCount || 0}</p>
                <p className="text-xs text-purple-600 font-medium">AI Orphan</p>
              </div>
              <div className="flex-1 text-center p-3 bg-blue-50 rounded-xl">
                <p className="text-xl font-bold text-blue-700">{stats?.manualCount || 0}</p>
                <p className="text-xs text-blue-600 font-medium">Manual</p>
              </div>
            </div>
          </Card>

          {/* E3: API Cost widget */}
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-4">API Cost (this month)</p>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#1A1A1A]">
                ${(stats?.monthlyCost || 0).toFixed(2)}
              </p>
              <p className="text-xs text-[#6B7280] mt-1">Estimated from batch records + pack generation</p>
            </div>
          </Card>
        </div>
      </div>

      {/* E5: Recent Packs table (replaces Recent AI Batches) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Recent Packs
          </p>
          <button onClick={() => navigate('/admin/daily-quiz')}
            className="text-sm text-[#1B3D2F] font-medium hover:underline"
          >
            View All →
          </button>
        </div>

        {packs.length === 0 ? (
          <p className="text-sm text-[#6B7280] text-center py-8">
            No packs yet. Generate your first daily pack!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D1D5DB]">
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Theme</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Difficulty</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Content</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Assigned</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Created</th>
                </tr>
              </thead>
              <tbody>
                {packs.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="py-2.5 px-3 capitalize">
                      {normalizeCategory(p.theme)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.difficulty === 'hard' ? 'bg-red-100 text-red-700'
                          : p.difficulty === 'easy' ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                        <span>{p.question_ids?.length || 0}Q</span>
                        <span>·</span>
                        <span>{p.puzzle_id ? '1P' : '0P'}</span>
                        <span>·</span>
                        <span>{p.lesson_id ? '1L' : '0L'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'ready' ? 'bg-green-100 text-green-700'
                          : p.status === 'assigned' ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#6B7280] text-xs">
                      {p.assigned_date || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[#6B7280] text-xs">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
