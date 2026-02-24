import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import {
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react'

/**
 * Get all days in a given month as YYYY-MM-DD strings.
 */
function getDaysInMonth(year, month) {
  const days = []
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    days.push(date.toISOString().split('T')[0])
  }
  return days
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DailyQuizPage() {
  const [viewMonth, setViewMonth] = useState(new Date())
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(null)

  // Pack state
  const [packsMap, setPacksMap] = useState({}) // { 'YYYY-MM-DD': pack }
  const [unassignedPacks, setUnassignedPacks] = useState([])
  const [showPackPicker, setShowPackPicker] = useState(null) // date string
  const [autoFillWithPacks, setAutoFillWithPacks] = useState(false)
  const [showAutoFillModal, setShowAutoFillModal] = useState(false)
  const [autoFillDuration, setAutoFillDuration] = useState('1_week')
  const [customDays, setCustomDays] = useState('')

  useEffect(() => {
    loadData()
  }, [viewMonth])

  async function loadData() {
    setLoading(true)
    try {
      const monthDays = getDaysInMonth(viewMonth.getFullYear(), viewMonth.getMonth())
      setDays(monthDays)

      // Load packs assigned to dates in this month
      const { data: assignedPacks } = await supabase
        .from('daily_packs')
        .select('id, theme, difficulty, question_ids, puzzle_id, lesson_id, status, assigned_date, created_at')
        .in('assigned_date', monthDays)
      const pMap = {}
      if (assignedPacks) {
        for (const p of assignedPacks) {
          if (p.assigned_date) pMap[p.assigned_date] = p
        }
      }
      setPacksMap(pMap)

      // Load unassigned packs for the picker
      const { data: unassigned } = await supabase
        .from('daily_packs')
        .select('id, theme, difficulty, question_ids, puzzle_id, lesson_id, status, created_at')
        .is('assigned_date', null)
        .in('status', ['ready', 'active'])
        .order('created_at', { ascending: false })
      setUnassignedPacks(unassigned || [])

    } catch (err) {
      if (err?.name !== 'AbortError') console.error('Load daily quiz error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Assign a pack to a date.
   */
  async function assignPack(date, packId) {
    try {
      const { error } = await supabase
        .from('daily_packs')
        .update({ assigned_date: date, status: 'assigned' })
        .eq('id', packId)
      if (error) throw error
      setShowPackPicker(null)
      await loadData()
    } catch (err) {
      console.error('Assign pack error:', err)
    }
  }

  /**
   * Unassign a pack from a date.
   */
  async function unassignPack(date) {
    const pack = packsMap[date]
    if (!pack) return
    try {
      const { error } = await supabase
        .from('daily_packs')
        .update({ assigned_date: null, status: 'ready' })
        .eq('id', pack.id)
      if (error) throw error
      await loadData()
    } catch (err) {
      console.error('Unassign pack error:', err)
    }
  }

  /**
   * Calculate empty dates for a duration period.
   */
  function getEmptyDatesForDuration(duration, customDaysVal) {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    let endDate = new Date(today)
    if (duration === 'custom' && customDaysVal > 0) {
      endDate.setDate(endDate.getDate() + Number(customDaysVal))
    } else if (duration === '1_week') endDate.setDate(endDate.getDate() + 7)
    else if (duration === '1_month') endDate.setMonth(endDate.getMonth() + 1)
    else if (duration === '3_months') endDate.setMonth(endDate.getMonth() + 3)

    // Generate all dates in range
    const allDates = []
    const cursor = new Date(today)
    while (cursor <= endDate) {
      allDates.push(cursor.toISOString().split('T')[0])
      cursor.setDate(cursor.getDate() + 1)
    }
    return allDates.filter(d => d >= todayStr && !packsMap[d])
  }

  const missingCount = getEmptyDatesForDuration(autoFillDuration, customDays).length

  /**
   * Auto-fill empty dates with unassigned packs.
   */
  async function autoFillPacks() {
    setAutoFillWithPacks(true)
    try {
      const emptyDates = getEmptyDatesForDuration(autoFillDuration, customDays)
      const { data: available } = await supabase
        .from('daily_packs')
        .select('id')
        .is('assigned_date', null)
        .in('status', ['ready', 'active'])
        .order('created_at', { ascending: true })
        .limit(emptyDates.length)

      if (!available || available.length === 0) {
        setAutoFillWithPacks(false)
        setShowAutoFillModal(false)
        return
      }

      for (let i = 0; i < Math.min(emptyDates.length, available.length); i++) {
        await supabase
          .from('daily_packs')
          .update({ assigned_date: emptyDates[i], status: 'assigned' })
          .eq('id', available[i].id)
      }
      await loadData()
      setShowAutoFillModal(false)
    } catch (err) {
      console.error('Auto-fill packs error:', err)
    } finally {
      setAutoFillWithPacks(false)
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
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Daily Quiz Planner</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Assign packs to schedule the daily quiz (3 questions + puzzle + lesson)
          </p>
        </div>
        <button
          onClick={() => setShowAutoFillModal(true)}
          disabled={autoFillWithPacks || unassignedPacks.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#1B3D2F] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
        >
          {autoFillWithPacks ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
          Auto-fill Packs ({unassignedPacks.length})
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            const prev = new Date(viewMonth)
            prev.setMonth(prev.getMonth() - 1)
            setViewMonth(prev)
          }}
          className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
        >
          <ChevronLeft size={20} className="text-[#1A1A1A]" />
        </button>
        <h3 className="text-lg font-bold text-[#1A1A1A]">
          {viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => {
            const next = new Date(viewMonth)
            next.setMonth(next.getMonth() + 1)
            setViewMonth(next)
          }}
          className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
        >
          <ChevronRight size={20} className="text-[#1A1A1A]" />
        </button>
      </div>

      {/* Calendar view */}
      <div className="space-y-3">
        {days.map((date) => {
          const d = new Date(date + 'T12:00:00')
          const dayName = DAY_NAMES[d.getDay()]
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const isToday = date === new Date().toISOString().split('T')[0]
          const pack = packsMap[date]
          const isExpanded = expandedDay === date

          return (
            <Card key={date} className={`p-0 overflow-hidden ${isToday ? 'ring-2 ring-[#2ECC71]' : ''}`}>
              {/* Day header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedDay(isExpanded ? null : date)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center ${isToday ? 'bg-[#1B3D2F] text-white' : 'bg-gray-100 text-[#1A1A1A]'}`}>
                    <span className="text-[9px] font-bold uppercase leading-none">{dayName}</span>
                    <span className="text-sm font-bold leading-none mt-0.5">{d.getDate()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">
                      {dateStr} {isToday && <span className="text-xs text-[#2ECC71] font-semibold ml-1">Today</span>}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {pack
                        ? `Pack: ${pack.theme} (${pack.question_ids?.length || 0}q${pack.puzzle_id ? '+puzzle' : ''}${pack.lesson_id ? '+lesson' : ''})`
                        : 'No pack assigned'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pack ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                      <CheckCircle size={12} />
                      Scheduled
                    </span>
                  ) : (
                    <span className="text-xs text-red-500 font-medium">
                      Empty
                    </span>
                  )}
                  {isExpanded ? <ChevronUp size={16} className="text-[#6B7280]" /> : <ChevronDown size={16} className="text-[#6B7280]" />}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  {pack ? (
                    /* Pack is assigned — show pack details */
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-emerald-600" />
                          <span className="text-sm font-semibold text-emerald-800">{pack.theme}</span>
                          <span className="text-xs text-emerald-600 capitalize">{pack.difficulty}</span>
                          {pack.created_at && (
                            <span className="text-[10px] text-emerald-500">
                              {new Date(pack.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                              {' '}
                              {new Date(pack.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => unassignPack(date)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Unassign
                        </button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                          <span className="font-medium">🧠 Questions:</span> {pack.question_ids?.length || 0}
                        </p>
                        <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                          <span className="font-medium">🧩 Puzzle:</span> {pack.puzzle_id ? 'Yes' : 'No'}
                        </p>
                        <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                          <span className="font-medium">📚 Lesson:</span> {pack.lesson_id ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* No pack — show assign button */
                    <div className="mt-3">
                      {unassignedPacks.length > 0 ? (
                        <button
                          onClick={() => setShowPackPicker(date)}
                          className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-emerald-300 rounded-xl text-sm text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
                        >
                          <Package size={16} />
                          Assign a pack to this day
                        </button>
                      ) : (
                        <p className="text-sm text-[#6B7280] text-center py-4">
                          No packs available. Generate packs from the AI Generator tab.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Auto-fill Modal */}
      {showAutoFillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1D5DB]">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Auto-fill Packs</h2>
              <button onClick={() => setShowAutoFillModal(false)} className="text-[#6B7280] hover:text-[#1A1A1A]">
                <XCircle size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-3">Duration</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { key: '1_week', label: '1 week' },
                  { key: '1_month', label: '1 month' },
                  { key: '3_months', label: '3 months' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setAutoFillDuration(opt.key); setCustomDays('') }}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      autoFillDuration === opt.key
                        ? 'bg-[#1B3D2F] text-white'
                        : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    placeholder="Custom"
                    className={`w-20 px-3 py-2 rounded-xl text-sm text-center border transition-all ${
                      autoFillDuration === 'custom'
                        ? 'border-[#1B3D2F] bg-[#1B3D2F]/5 font-semibold'
                        : 'border-gray-200'
                    }`}
                    value={customDays}
                    onChange={(e) => {
                      const val = e.target.value
                      setCustomDays(val)
                      if (val && Number(val) > 0) setAutoFillDuration('custom')
                    }}
                  />
                  <span className="text-xs text-[#6B7280]">days</span>
                </div>
              </div>

              {/* Missing packs info */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                <p className="text-sm font-semibold text-amber-800">
                  {missingCount} days without packs
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {unassignedPacks.length} packs available to assign
                </p>
                {missingCount > unassignedPacks.length && (
                  <p className="text-xs text-red-600 font-semibold mt-1">
                    ⚠️ Not enough packs! Generate {missingCount - unassignedPacks.length} more.
                  </p>
                )}
              </div>

              {/* Link to generator */}
              <a
                href="/admin/generate"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-4 border-2 border-dashed border-[#2ECC71] rounded-xl text-sm font-semibold text-[#2ECC71] hover:bg-emerald-50 transition-colors"
              >
                🤖 Go to AI Generator
              </a>
            </div>
            <div className="flex items-center gap-2 px-6 py-4 border-t border-[#D1D5DB]">
              <button
                onClick={() => setShowAutoFillModal(false)}
                className="flex-1 px-4 py-2 text-sm text-[#6B7280] font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={autoFillPacks}
                disabled={autoFillWithPacks || unassignedPacks.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {autoFillWithPacks ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                Fill {Math.min(missingCount, unassignedPacks.length)} days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pack Picker Modal */}
      {showPackPicker && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1D5DB]">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">Assign Pack</h2>
                <p className="text-xs text-[#6B7280]">{showPackPicker} — Pick a pack to assign</p>
              </div>
              <button onClick={() => setShowPackPicker(null)} className="text-[#6B7280] hover:text-[#1A1A1A]">
                <XCircle size={20} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {unassignedPacks.length === 0 ? (
                <p className="text-sm text-[#6B7280] text-center py-8">No unassigned packs available</p>
              ) : unassignedPacks.map(p => (
                <div
                  key={p.id}
                  onClick={() => assignPack(showPackPicker, p.id)}
                  className="flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-emerald-50 transition-colors"
                >
                  <Package size={16} className="text-[#2ECC71] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A]">{p.theme}</p>
                    <p className="text-xs text-[#6B7280]">
                      {p.difficulty} — {p.question_ids?.length || 0} questions
                      {p.puzzle_id && ' + puzzle'}
                      {p.lesson_id && ' + lesson'}
                      {p.created_at && ` · ${new Date(p.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-[#D1D5DB]">
              <button
                onClick={() => setShowPackPicker(null)}
                className="px-4 py-2 text-sm text-[#6B7280] font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
