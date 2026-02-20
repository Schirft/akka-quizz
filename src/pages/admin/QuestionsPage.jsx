import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../config/constants'
import Card from '../../components/ui/Card'
import QuestionModal from '../../components/admin/QuestionModal'
import ImportModal from '../../components/admin/ImportModal'
import {
  Search,
  Plus,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Upload,
  Download,
  Loader2,
  Trash2,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Puzzle,
  Pencil,
  Eye,
  EyeOff,
} from 'lucide-react'

const PAGE_SIZE = 20

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-700',
  pending_review: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
}

const DIFF_COLORS = {
  easy: 'text-green-600',
  medium: 'text-amber-600',
  hard: 'text-red-600',
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [modalQuestion, setModalQuestion] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [approvingAll, setApprovingAll] = useState(false)
  const [exporting, setExporting] = useState(false)

  // FIX 8e: Sortable columns
  const [sortCol, setSortCol] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  // FIX 8d: Bulk select
  const [selected, setSelected] = useState(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false) // HOTFIX F: delete confirmation

  // FIX 8c: Stats counts
  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0, total: 0 })

  // FIX 6: Duplicates
  const [findingDupes, setFindingDupes] = useState(false)
  const [duplicates, setDuplicates] = useState(null) // array of {original, duplicate} pairs

  // FIX 8a: Scheduled questions
  const [scheduledIds, setScheduledIds] = useState(new Set())

  // C5: Packs section
  const [packs, setPacks] = useState([])
  const [packsLoading, setPacksLoading] = useState(false)
  const [expandedPack, setExpandedPack] = useState(null)
  const [packDetails, setPackDetails] = useState({}) // { packId: { questions, puzzle, lesson } }
  const [showPacks, setShowPacks] = useState(false)
  const [editPuzzle, setEditPuzzle] = useState(null)
  const [editLesson, setEditLesson] = useState(null)

  // Debounce search
  const searchTimeoutRef = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(searchTimeoutRef.current)
  }, [search])

  // Load stats on mount
  useEffect(() => {
    async function loadStats() {
      const [
        { count: approved },
        { count: pending },
        { count: rejected },
        { count: total },
      ] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
      ])
      setStats({ approved: approved || 0, pending: pending || 0, rejected: rejected || 0, total: total || 0 })
    }
    loadStats()
  }, [questions]) // refresh when questions change

  // FIX 8a: Load scheduled question IDs (next 7 days)
  useEffect(() => {
    async function loadScheduled() {
      const now = new Date()
      const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const { data } = await supabase
        .from('daily_quizzes')
        .select('question_1_id, question_2_id, question_3_id, question_4_id, question_5_id, quiz_date')
        .gte('quiz_date', now.toISOString().split('T')[0])
        .lte('quiz_date', in7.toISOString().split('T')[0])
      if (data) {
        const ids = new Set()
        const dateMap = {}
        for (const dq of data) {
          const qIds = [dq.question_1_id, dq.question_2_id, dq.question_3_id, dq.question_4_id, dq.question_5_id].filter(Boolean)
          for (const qid of qIds) {
            ids.add(qid)
            dateMap[qid] = dq.quiz_date
          }
        }
        setScheduledIds(ids)
        window.__akka_scheduledMap = dateMap
      }
    }
    loadScheduled()
  }, [])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      // FIX 8e: Dynamic sort
      const sortColumn = sortCol === 'question' ? 'question_en' : sortCol
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .order(sortColumn, { ascending: sortDir === 'asc' })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (filterStatus !== 'all') query = query.eq('status', filterStatus)
      if (filterCategory !== 'all') query = query.eq('macro_category', filterCategory)
      if (filterSource !== 'all') query = query.eq('source', filterSource)
      if (debouncedSearch.trim()) query = query.ilike('question_en', `%${debouncedSearch.trim()}%`)

      const { data, count, error } = await query
      if (error) throw error

      setQuestions(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      if (err?.name !== 'AbortError') console.error('Load questions error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterCategory, filterSource, debouncedSearch, sortCol, sortDir])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  useEffect(() => {
    setPage(0)
  }, [filterStatus, filterCategory, filterSource, debouncedSearch, sortCol, sortDir])

  // FIX 8e: Toggle sort
  function toggleSort(col) {
    if (sortCol === col) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir(col === 'created_at' ? 'desc' : 'asc')
    }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <ArrowUpDown size={12} className="text-gray-300" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-[#1B3D2F]" />
      : <ArrowDown size={12} className="text-[#1B3D2F]" />
  }

  async function quickStatusChange(id, newStatus) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
      )
    } catch (err) {
      console.error('Status change error:', err)
    }
  }

  async function approveAllPending() {
    setApprovingAll(true)
    try {
      let query = supabase
        .from('questions')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('status', 'pending_review')

      if (filterSource !== 'all') query = query.eq('source', filterSource)
      if (filterCategory !== 'all') query = query.eq('macro_category', filterCategory)

      const { error } = await query
      if (error) throw error
      await loadQuestions()
    } catch (err) {
      console.error('Approve all error:', err)
    } finally {
      setApprovingAll(false)
    }
  }

  // FIX 8d: Bulk actions
  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === questions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(questions.map((q) => q.id)))
    }
  }

  async function bulkAction(action) {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    // HOTFIX F: Require confirmation for delete
    if (action === 'delete' && !confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setBulkLoading(true)
    setConfirmDelete(false)
    try {
      if (action === 'delete') {
        await supabase.from('questions').delete().in('id', ids)
      } else {
        await supabase
          .from('questions')
          .update({ status: action, updated_at: new Date().toISOString() })
          .in('id', ids)
      }
      setSelected(new Set())
      await loadQuestions()
    } catch (err) {
      console.error('Bulk action error:', err)
    } finally {
      setBulkLoading(false)
    }
  }

  // FIX 6: Export CSV with dedup
  async function handleExport() {
    setExporting(true)
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('status', 'approved')
        .order('macro_category', { ascending: true })

      if (error) throw error
      if (!data || data.length === 0) {
        alert('No approved questions to export')
        setExporting(false)
        return
      }

      // FIX 6: Dedup — remove questions with duplicate first 50 chars
      const seen = new Set()
      const dedupData = data.filter((q) => {
        const prefix = (q.question_en || '').slice(0, 50).toLowerCase()
        if (seen.has(prefix)) return false
        seen.add(prefix)
        return true
      })

      const headers = [
        'question_en', 'question_fr', 'question_it', 'question_es',
        'answers_en', 'answers_fr', 'answers_it', 'answers_es',
        'explanation_en', 'explanation_fr', 'explanation_it', 'explanation_es',
        'correct_answer_index', 'macro_category', 'sub_category', 'topic',
        'difficulty', 'source',
      ]

      const csvRows = [headers.join(',')]
      for (const q of dedupData) {
        const row = headers.map((h) => {
          const val = q[h]
          if (val === null || val === undefined) return ''
          if (Array.isArray(val) || typeof val === 'object') {
            return `"${JSON.stringify(val).replace(/"/g, '""')}"`
          }
          return `"${String(val).replace(/"/g, '""')}"`
        })
        csvRows.push(row.join(','))
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `akka_questions_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)

      if (dedupData.length < data.length) {
        alert(`Exported ${dedupData.length} questions (${data.length - dedupData.length} duplicates removed)`)
      }
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  // FIX 6: Find duplicates
  async function findDuplicates() {
    setFindingDupes(true)
    setDuplicates(null)
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('id, question_en, created_at')
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by first 50 chars
      const groups = {}
      for (const q of data) {
        const prefix = (q.question_en || '').slice(0, 50).toLowerCase()
        if (!prefix) continue
        if (!groups[prefix]) groups[prefix] = []
        groups[prefix].push(q)
      }

      // Find groups with >1 entry
      const dupeList = []
      for (const [prefix, items] of Object.entries(groups)) {
        if (items.length > 1) {
          // Keep first (original), rest are duplicates
          for (let i = 1; i < items.length; i++) {
            dupeList.push({ original: items[0], duplicate: items[i] })
          }
        }
      }

      setDuplicates(dupeList)
    } catch (err) {
      console.error('Find duplicates error:', err)
    } finally {
      setFindingDupes(false)
    }
  }

  async function deleteDuplicate(id) {
    try {
      await supabase.from('questions').delete().eq('id', id)
      setDuplicates((prev) => prev.filter((d) => d.duplicate.id !== id))
      await loadQuestions()
    } catch (err) {
      console.error('Delete duplicate error:', err)
    }
  }

  async function deleteAllDuplicates() {
    if (!duplicates || duplicates.length === 0) return
    const ids = duplicates.map((d) => d.duplicate.id)
    try {
      await supabase.from('questions').delete().in('id', ids)
      setDuplicates([])
      await loadQuestions()
    } catch (err) {
      console.error('Delete all duplicates error:', err)
    }
  }

  // C5: Load packs on mount
  async function loadPacks() {
    setPacksLoading(true)
    try {
      const { data, error } = await supabase
        .from('daily_packs')
        .select('id, theme, difficulty, question_ids, puzzle_id, lesson_id, status, assigned_date, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      setPacks(data || [])
    } catch (err) {
      console.error('Load packs error:', err)
    } finally {
      setPacksLoading(false)
    }
  }

  // Load packs on mount
  useEffect(() => { loadPacks() }, [])

  // C5: Load pack details (questions + puzzle + lesson) when expanding
  async function loadPackDetails(pack) {
    if (packDetails[pack.id]) return // already loaded
    try {
      const details = { questions: [], puzzle: null, lesson: null }

      // Load questions by IDs
      if (pack.question_ids?.length > 0) {
        const { data: qs } = await supabase
          .from('questions')
          .select('id, question_en, answers_en, correct_answer_index, macro_category, difficulty, status')
          .in('id', pack.question_ids)
        details.questions = qs || []
      }

      // Load puzzle
      if (pack.puzzle_id) {
        const { data: pz } = await supabase
          .from('puzzles')
          .select('id, interaction_type, title, subtitle, answer, explanation, context_data, hint')
          .eq('id', pack.puzzle_id)
          .maybeSingle()
        details.puzzle = pz
      }

      // Load lesson
      if (pack.lesson_id) {
        const { data: ls } = await supabase
          .from('daily_lessons')
          .select('id, title, content, key_takeaway')
          .eq('id', pack.lesson_id)
          .maybeSingle()
        details.lesson = ls
      }

      setPackDetails(prev => ({ ...prev, [pack.id]: details }))
    } catch (err) {
      console.error('Load pack details error:', err)
    }
  }

  function togglePackExpand(pack) {
    if (expandedPack === pack.id) {
      setExpandedPack(null)
    } else {
      setExpandedPack(pack.id)
      loadPackDetails(pack)
    }
  }

  // B2: Toggle pack active/inactive
  async function handleTogglePackStatus(packId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await supabase.from('daily_packs').update({ status: newStatus }).eq('id', packId)
      setPacks(prev => prev.map(p => p.id === packId ? { ...p, status: newStatus } : p))
    } catch (err) { console.error('Toggle pack status error:', err) }
  }

  // B2: Delete pack
  async function handleDeletePack(packId) {
    if (!window.confirm('Delete this pack? This cannot be undone.')) return
    try {
      await supabase.from('daily_packs').delete().eq('id', packId)
      setPacks(prev => prev.filter(p => p.id !== packId))
      setExpandedPack(null)
      setPackDetails(prev => { const n = { ...prev }; delete n[packId]; return n })
    } catch (err) { console.error('Delete pack error:', err) }
  }

  // B2: Save puzzle edits
  async function handleSavePuzzle(puzzle) {
    try {
      const { error } = await supabase.from('puzzles').update({
        title: puzzle.title,
        hint: puzzle.hint,
        answer: puzzle.answer,
        context_data: typeof puzzle.context_data === 'string' ? JSON.parse(puzzle.context_data) : puzzle.context_data,
      }).eq('id', puzzle.id)
      if (error) throw error
      // Refresh cache
      setPackDetails(prev => {
        const next = { ...prev }
        for (const [pid, det] of Object.entries(next)) {
          if (det.puzzle?.id === puzzle.id) {
            next[pid] = { ...det, puzzle: { ...det.puzzle, title: puzzle.title, hint: puzzle.hint, answer: puzzle.answer, context_data: typeof puzzle.context_data === 'string' ? JSON.parse(puzzle.context_data) : puzzle.context_data } }
          }
        }
        return next
      })
      setEditPuzzle(null)
    } catch (err) { console.error('Save puzzle error:', err) }
  }

  // B2: Save lesson edits
  async function handleSaveLesson(lesson) {
    try {
      const { error } = await supabase.from('daily_lessons').update({
        title: lesson.title,
        content: lesson.content,
        key_takeaway: lesson.key_takeaway,
      }).eq('id', lesson.id)
      if (error) throw error
      // Refresh cache
      setPackDetails(prev => {
        const next = { ...prev }
        for (const [pid, det] of Object.entries(next)) {
          if (det.lesson?.id === lesson.id) {
            next[pid] = { ...det, lesson: { ...det.lesson, title: lesson.title, content: lesson.content, key_takeaway: lesson.key_takeaway } }
          }
        }
        return next
      })
      setEditLesson(null)
    } catch (err) { console.error('Save lesson error:', err) }
  }

  // B2: Refresh pack details after question edit
  function handleQuestionSavedInPack() {
    loadQuestions()
    // Also refresh expanded pack details
    setPackDetails(prev => {
      const next = { ...prev }
      if (expandedPack && next[expandedPack]) {
        delete next[expandedPack]
      }
      return next
    })
    if (expandedPack) {
      const pack = packs.find(p => p.id === expandedPack)
      if (pack) setTimeout(() => loadPackDetails(pack), 100)
    }
  }

  // FIX 5: Format date
  function formatDate(dateStr) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) +
      ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  // FIX 8a: Get scheduled date for question
  function getScheduledDate(qId) {
    const dateStr = window.__akka_scheduledMap?.[qId]
    if (!dateStr) return null
    const d = new Date(dateStr + 'T00:00:00')
    const day = d.toLocaleDateString('en-US', { weekday: 'short' })
    const num = d.getDate()
    return `📅 ${day} ${num}`
  }

  // HOTFIX D: Get language flags for a question
  function getLangFlags(q) {
    let flags = '🇬🇧' // EN is always present
    if (q.question_fr) flags += '🇫🇷'
    if (q.question_it) flags += '🇮🇹'
    if (q.question_es) flags += '🇪🇸'
    return flags
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const pendingCount = questions.filter((q) => q.status === 'pending_review').length
  const showApproveAll = filterStatus === 'pending_review' || (filterSource !== 'all' && pendingCount > 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Questions</h1>
          <p className="text-sm text-[#6B7280] mt-1">{totalCount} questions total</p>
        </div>
        <div className="flex items-center gap-2">
          {/* FIX 6: Find duplicates */}
          <button
            onClick={findDuplicates}
            disabled={findingDupes}
            className="flex items-center gap-1.5 px-3 py-2.5 border border-[#D1D5DB] text-[#1A1A1A] text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            {findingDupes ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
            Find Duplicates
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2.5 border border-[#D1D5DB] text-[#1A1A1A] text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export CSV
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-3 py-2.5 border border-[#D1D5DB] text-[#1A1A1A] text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            onClick={() => setModalQuestion({})}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3D2F] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            New Question
          </button>
        </div>
      </div>

      {/* FIX 8c: Stats bar */}
      <div className="flex items-center gap-4 mb-4 px-1">
        <button
          onClick={() => setFilterStatus('approved')}
          className={`text-sm font-medium transition-colors ${filterStatus === 'approved' ? 'text-green-700 underline' : 'text-[#6B7280] hover:text-green-700'}`}
        >
          🟢 {stats.approved} Approved
        </button>
        <button
          onClick={() => setFilterStatus('pending_review')}
          className={`text-sm font-medium transition-colors ${filterStatus === 'pending_review' ? 'text-amber-700 underline' : 'text-[#6B7280] hover:text-amber-700'}`}
        >
          🟡 {stats.pending} Pending
        </button>
        <button
          onClick={() => setFilterStatus('rejected')}
          className={`text-sm font-medium transition-colors ${filterStatus === 'rejected' ? 'text-red-700 underline' : 'text-[#6B7280] hover:text-red-700'}`}
        >
          🔴 {stats.rejected} Rejected
        </button>
        <button
          onClick={() => setFilterStatus('all')}
          className={`text-sm font-medium transition-colors ${filterStatus === 'all' ? 'text-[#1A1A1A] underline' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}
        >
          📊 {stats.total} Total
        </button>
      </div>

      {/* FIX 6: Duplicates panel */}
      {duplicates !== null && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#1A1A1A]">
              🔍 Found {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              {duplicates.length > 0 && (
                <button
                  onClick={deleteAllDuplicates}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={12} />
                  Delete All Duplicates
                </button>
              )}
              <button
                onClick={() => setDuplicates(null)}
                className="text-xs text-[#6B7280] hover:text-[#1A1A1A] px-2"
              >
                Close
              </button>
            </div>
          </div>
          {duplicates.length === 0 ? (
            <p className="text-sm text-green-600">✅ No duplicates found!</p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {duplicates.map((d) => (
                <div key={d.duplicate.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-[#1A1A1A] truncate flex-1 mr-2">
                    {d.duplicate.question_en?.slice(0, 80)}
                  </p>
                  <button
                    onClick={() => deleteDuplicate(d.duplicate.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition-colors shrink-0"
                  >
                    <Trash2 size={11} />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* I1-I3: Packs flat list — separated into Today + Past */}
      {(() => {
        const today = new Date().toISOString().split('T')[0]
        const todayPacks = packs.filter(p => p.assigned_date === today)
        const pastPacks = packs.filter(p => p.assigned_date !== today)

        function renderPackRow(pack) {
          const isExpanded = expandedPack === pack.id
          const details = packDetails[pack.id]
          return (
            <div key={pack.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div
                onClick={() => togglePackExpand(pack)}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Package size={14} className="text-[#2ECC71] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">
                      {pack.theme} — <span className="capitalize text-[#6B7280]">{pack.difficulty}</span>
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {pack.question_ids?.length || 0} Q
                      {pack.puzzle_id ? ' + puzzle' : ''}
                      {pack.lesson_id ? ' + lesson' : ''}
                      {pack.assigned_date ? ` — ${pack.assigned_date}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    pack.status === 'active' ? 'bg-green-100 text-green-700' :
                    pack.status === 'ready' ? 'bg-green-100 text-green-700' :
                    pack.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {pack.status}
                  </span>
                  {isExpanded ? <ChevronUp size={14} className="text-[#6B7280]" /> : <ChevronDown size={14} className="text-[#6B7280]" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3">
                  {details ? (
                    <>
                      {/* Questions — full preview */}
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Questions ({details.questions.length})</p>
                        {details.questions.length > 0 ? (
                          <div className="space-y-2">
                            {details.questions.map((q, i) => (
                              <div key={q.id} className="px-3 py-2.5 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="w-5 h-5 rounded-full bg-[#1B3D2F] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                  <span className={`text-[10px] font-medium capitalize ${
                                    q.difficulty === 'hard' ? 'text-red-600' : q.difficulty === 'medium' ? 'text-amber-600' : 'text-green-600'
                                  }`}>{q.difficulty}</span>
                                  <button onClick={(e) => { e.stopPropagation(); setModalQuestion(q) }} className="ml-auto p-1 rounded hover:bg-gray-200 transition-colors" title="Edit question">
                                    <Pencil size={11} className="text-[#6B7280]" />
                                  </button>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${STATUS_BADGE[q.status] || 'bg-gray-100 text-gray-700'}`}>
                                    {q.status}
                                  </span>
                                </div>
                                <p className="text-xs text-[#1A1A1A] mb-1.5">{q.question_en}</p>
                                {q.answers_en && (
                                  <div className="grid grid-cols-2 gap-1">
                                    {q.answers_en.map((a, j) => (
                                      <div key={j} className={`text-[10px] px-2 py-1 rounded ${
                                        j === (q.correct_answer_index - 1) ? 'bg-green-100 text-green-800 font-medium' : 'bg-white text-gray-600 border border-gray-100'
                                      }`}>
                                        {String.fromCharCode(65 + j)}. {a}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-red-500">No questions found (IDs missing?)</p>
                        )}
                      </div>

                      {/* Puzzle — full preview */}
                      {details.puzzle && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide flex items-center gap-1">
                              <Puzzle size={12} /> Puzzle — {details.puzzle.interaction_type}
                            </p>
                            <button onClick={() => setEditPuzzle({ ...details.puzzle, context_data: details.puzzle.context_data ? JSON.stringify(details.puzzle.context_data, null, 2) : '' })} className="text-[10px] text-amber-700 font-medium hover:underline flex items-center gap-1">
                              <Pencil size={10} /> Edit
                            </button>
                          </div>
                          <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5">
                            <p className="text-xs font-medium text-[#1A1A1A]">{details.puzzle.title || 'Untitled'}</p>
                            {details.puzzle.subtitle && <p className="text-[10px] text-amber-700">{details.puzzle.subtitle}</p>}
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-[#6B7280]">
                              <span>Type: <b>{details.puzzle.interaction_type}</b></span>
                              <span>Answer: <b>{details.puzzle.answer}</b></span>
                              {details.puzzle.hint && <span>Hint: {details.puzzle.hint}</span>}
                            </div>
                            {details.puzzle.explanation && (
                              <p className="text-[10px] text-gray-600 mt-1 line-clamp-3">{details.puzzle.explanation}</p>
                            )}
                            {details.puzzle.context_data && (
                              <details className="mt-1">
                                <summary className="text-[10px] text-amber-700 cursor-pointer font-medium">Show context_data</summary>
                                <pre className="text-[9px] text-gray-600 mt-1 bg-white rounded p-2 overflow-auto max-h-[200px] border border-amber-100">
                                  {JSON.stringify(details.puzzle.context_data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Lesson — full preview */}
                      {details.lesson && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide flex items-center gap-1">
                              <BookOpen size={12} /> Lesson
                            </p>
                            <button onClick={() => setEditLesson({ ...details.lesson })} className="text-[10px] text-blue-700 font-medium hover:underline flex items-center gap-1">
                              <Pencil size={10} /> Edit
                            </button>
                          </div>
                          <div className="px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5">
                            <p className="text-xs font-medium text-[#1A1A1A]">{details.lesson.title || 'Untitled'}</p>
                            {details.lesson.content && (
                              <p className="text-[10px] text-gray-600 line-clamp-4">{details.lesson.content}</p>
                            )}
                            {details.lesson.key_takeaway && (
                              <p className="text-[10px] text-blue-700 font-medium mt-1">Key takeaway: {details.lesson.key_takeaway}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Missing content warnings */}
                      {!details.puzzle && !pack.puzzle_id && (
                        <p className="text-[10px] text-amber-600">⚠ No puzzle in this pack</p>
                      )}
                      {!details.lesson && !pack.lesson_id && (
                        <p className="text-[10px] text-amber-600">⚠ No lesson in this pack</p>
                      )}

                      {/* B2: Pack actions — Activate/Deactivate + Delete */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTogglePackStatus(pack.id, pack.status) }}
                          className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium rounded-lg transition-colors ${
                            pack.status === 'active'
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {pack.status === 'active' ? <><EyeOff size={11} /> Deactivate</> : <><Eye size={11} /> Activate</>}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePack(pack.id) }}
                          className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors ml-auto"
                        >
                          <Trash2 size={11} /> Delete Pack
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 size={16} className="animate-spin text-[#6B7280]" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        }

        return (
          <>
            {/* Today's Packs */}
            {todayPacks.length > 0 && (
              <Card className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package size={18} className="text-[#2ECC71]" />
                  <span className="text-sm font-semibold text-[#1A1A1A]">Today's Packs</span>
                  <span className="text-xs text-[#6B7280]">({todayPacks.length})</span>
                </div>
                <div className="space-y-2">
                  {todayPacks.map(renderPackRow)}
                </div>
              </Card>
            )}

            {/* All Packs */}
            <Card className="mb-4">
              <button
                onClick={() => setShowPacks(!showPacks)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-[#1B3D2F]" />
                  <span className="text-sm font-semibold text-[#1A1A1A]">
                    {todayPacks.length > 0 ? 'Past Packs' : 'All Packs'}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    ({(todayPacks.length > 0 ? pastPacks : packs).length})
                  </span>
                </div>
                {showPacks ? <ChevronUp size={16} className="text-[#6B7280]" /> : <ChevronDown size={16} className="text-[#6B7280]" />}
              </button>

              {showPacks && (
                <div className="mt-4 space-y-2">
                  {packsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={20} className="animate-spin text-[#6B7280]" />
                    </div>
                  ) : (todayPacks.length > 0 ? pastPacks : packs).length === 0 ? (
                    <p className="text-sm text-[#6B7280] text-center py-4">No packs generated yet</p>
                  ) : (todayPacks.length > 0 ? pastPacks : packs).map(renderPackRow)}
                </div>
              )}
            </Card>
          </>
        )
      })()}

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending_review">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71] max-w-[200px]"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
          >
            <option value="all">All Sources</option>
            <option value="manual">Manual</option>
            <option value="import">Import</option>
            <option value="ai">AI</option>
          </select>

          {showApproveAll && (
            <button
              onClick={approveAllPending}
              disabled={approvingAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#2ECC71] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {approvingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Approve All Pending
            </button>
          )}
        </div>
      </Card>

      {/* FIX 8d + HOTFIX F: Bulk action bar with counts & delete confirmation */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-sm font-medium text-blue-700">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {confirmDelete ? (
              <>
                <span className="text-xs text-red-700 font-medium">Delete {selected.size} question{selected.size > 1 ? 's' : ''}? This cannot be undone.</span>
                <button
                  onClick={() => bulkAction('delete')}
                  disabled={bulkLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={12} /> Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => bulkAction('approved')}
                  disabled={bulkLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200 transition-colors"
                >
                  <CheckCircle size={12} /> Approve ({selected.size})
                </button>
                <button
                  onClick={() => bulkAction('rejected')}
                  disabled={bulkLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
                >
                  <XCircle size={12} /> Reject ({selected.size})
                </button>
                <button
                  onClick={() => bulkAction('delete')}
                  disabled={bulkLoading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={12} /> Delete ({selected.size})
                </button>
              </>
            )}
            {bulkLoading && <Loader2 size={14} className="animate-spin text-blue-500" />}
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <Filter size={32} className="mx-auto text-[#6B7280] mb-3" />
            <p className="text-[#6B7280]">No questions match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D1D5DB] bg-gray-50/50">
                  {/* FIX 8d: Select all checkbox */}
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === questions.length && questions.length > 0}
                      onChange={toggleSelectAll}
                      className="accent-[#1B3D2F] cursor-pointer"
                    />
                  </th>
                  <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">#</th>
                  {/* FIX 8e: Sortable question */}
                  <th
                    className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280] cursor-pointer select-none"
                    onClick={() => toggleSort('question')}
                  >
                    <span className="flex items-center gap-1">Question <SortIcon col="question" /></span>
                  </th>
                  <th
                    className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280] cursor-pointer select-none"
                    onClick={() => toggleSort('macro_category')}
                  >
                    <span className="flex items-center gap-1">Category <SortIcon col="macro_category" /></span>
                  </th>
                  <th
                    className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280] cursor-pointer select-none"
                    onClick={() => toggleSort('difficulty')}
                  >
                    <span className="flex items-center gap-1">Diff. <SortIcon col="difficulty" /></span>
                  </th>
                  <th
                    className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280] cursor-pointer select-none"
                    onClick={() => toggleSort('status')}
                  >
                    <span className="flex items-center gap-1">Status <SortIcon col="status" /></span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Source</th>
                  {/* HOTFIX D: Language flags column */}
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Lang</th>
                  {/* FIX 5: Created date column */}
                  <th
                    className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280] cursor-pointer select-none"
                    onClick={() => toggleSort('created_at')}
                  >
                    <span className="flex items-center gap-1">Created <SortIcon col="created_at" /></span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => {
                  const schedBadge = getScheduledDate(q.id)
                  return (
                    <tr
                      key={q.id}
                      onClick={() => setModalQuestion(q)}
                      className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/50 cursor-pointer transition-colors ${
                        selected.has(q.id) ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      {/* FIX 8d: Individual checkbox */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(q.id)}
                          onChange={() => toggleSelect(q.id)}
                          className="accent-[#1B3D2F] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2 text-[#6B7280] font-mono text-xs">
                        {page * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="py-3 px-4 max-w-[260px]">
                        <p className="text-[#1A1A1A] truncate">{q.question_en?.slice(0, 55)}{q.question_en?.length > 55 ? '...' : ''}</p>
                        {/* FIX 8a: Scheduled badge */}
                        {schedBadge && (
                          <span className="text-[10px] text-blue-600 font-medium">{schedBadge}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-[#6B7280] truncate block max-w-[120px]">
                          {q.macro_category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium capitalize ${DIFF_COLORS[q.difficulty] || 'text-gray-600'}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[q.status] || 'bg-gray-100 text-gray-700'}`}>
                          {(q.status || '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-[#6B7280] capitalize">{q.source}</span>
                      </td>
                      {/* HOTFIX D: Language flags */}
                      <td className="py-3 px-3">
                        <span className="text-xs tracking-wide" title={[
                          'EN',
                          q.question_fr ? 'FR' : null,
                          q.question_it ? 'IT' : null,
                          q.question_es ? 'ES' : null,
                        ].filter(Boolean).join(', ')}>
                          {getLangFlags(q)}
                        </span>
                      </td>
                      {/* FIX 5: Created date */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-[#6B7280]">{formatDate(q.created_at)}</span>
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {q.status === 'pending_review' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); quickStatusChange(q.id, 'approved') }}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 cursor-pointer transition-colors"
                                title="Approve"
                              >
                                <CheckCircle size={16} className="pointer-events-none" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); quickStatusChange(q.id, 'rejected') }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                                title="Reject"
                              >
                                <XCircle size={16} className="pointer-events-none" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#D1D5DB]">
            <p className="text-xs text-[#6B7280]">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} className="pointer-events-none" />
              </button>
              <span className="text-sm text-[#1A1A1A] font-medium px-2">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} className="pointer-events-none" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Question Edit Modal */}
      {modalQuestion !== null && (
        <QuestionModal
          question={modalQuestion}
          onClose={() => setModalQuestion(null)}
          onSaved={handleQuestionSavedInPack}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={loadQuestions}
        />
      )}

      {/* B2: Puzzle Edit Modal */}
      {editPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditPuzzle(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">Edit Puzzle</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-[#6B7280] uppercase">Title</label>
                <input value={editPuzzle.title || ''} onChange={e => setEditPuzzle(p => ({ ...p, title: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#6B7280] uppercase">Hint</label>
                <input value={editPuzzle.hint || ''} onChange={e => setEditPuzzle(p => ({ ...p, hint: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#6B7280] uppercase">Answer</label>
                <input value={editPuzzle.answer || ''} onChange={e => setEditPuzzle(p => ({ ...p, answer: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#6B7280] uppercase">Context Data (JSON)</label>
                <textarea value={typeof editPuzzle.context_data === 'string' ? editPuzzle.context_data : JSON.stringify(editPuzzle.context_data, null, 2)} onChange={e => setEditPuzzle(p => ({ ...p, context_data: e.target.value }))} rows={6} className="w-full mt-1 px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditPuzzle(null)} className="flex-1 py-2 text-xs font-medium text-[#6B7280] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={() => handleSavePuzzle(editPuzzle)} className="flex-1 py-2 text-xs font-medium text-white bg-[#1B3D2F] rounded-lg hover:bg-[#15332A] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* B2: Lesson Edit Modal */}
      {editLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditLesson(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">Edit Lesson</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-[#6B7280] uppercase">Title</label>
                <input value={editLesson.title || ''} onChange={e => setEditLesson(l => ({ ...l, title: e.target.value }))} className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#6B7280] uppercase">Content</label>
                <textarea value={editLesson.content || ''} onChange={e => setEditLesson(l => ({ ...l, content: e.target.value }))} rows={8} className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#6B7280] uppercase">Key Takeaway</label>
                <textarea value={editLesson.key_takeaway || ''} onChange={e => setEditLesson(l => ({ ...l, key_takeaway: e.target.value }))} rows={3} className="w-full mt-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ECC71]/30" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditLesson(null)} className="flex-1 py-2 text-xs font-medium text-[#6B7280] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={() => handleSaveLesson(editLesson)} className="flex-1 py-2 text-xs font-medium text-white bg-[#1B3D2F] rounded-lg hover:bg-[#15332A] transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
