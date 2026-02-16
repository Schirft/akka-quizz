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
} from 'lucide-react'

const PAGE_SIZE = 20

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-700',
  pending_review: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
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

  // Debounce search input
  const searchTimeoutRef = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(searchTimeoutRef.current)
  }, [search])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
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
      console.error('Load questions error:', err)
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, filterCategory, filterSource, debouncedSearch])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  // Reset page on filter change (use functional update to avoid race)
  useEffect(() => {
    setPage(0)
  }, [filterStatus, filterCategory, filterSource, debouncedSearch])

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

  // BUG 7: Approve All Pending (filtered by current source)
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

  // FEATURE 10: Export CSV
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

      // Build CSV
      const headers = [
        'question_en', 'question_fr', 'question_it', 'question_es',
        'answers_en', 'answers_fr', 'answers_it', 'answers_es',
        'explanation_en', 'explanation_fr', 'explanation_it', 'explanation_es',
        'correct_answer_index', 'macro_category', 'sub_category', 'topic',
        'difficulty', 'source',
      ]

      const csvRows = [headers.join(',')]
      for (const q of data) {
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
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const pendingCount = questions.filter((q) => q.status === 'pending_review').length
  const showApproveAll = filterStatus === 'pending_review' || (filterSource !== 'all' && pendingCount > 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Questions</h1>
          <p className="text-sm text-[#6B7280] mt-1">{totalCount} questions total</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Filters + Approve All */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
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

          {/* Status filter */}
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

          {/* Category filter */}
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

          {/* Source filter */}
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

          {/* Approve All Pending button */}
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
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">#</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Question</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Diff.</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Lang</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Source</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => (
                  <tr
                    key={q.id}
                    onClick={() => setModalQuestion(q)}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-[#6B7280] font-mono text-xs">
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="py-3 px-4 max-w-[300px]">
                      <p className="text-[#1A1A1A] truncate">{q.question_en?.slice(0, 60)}{q.question_en?.length > 60 ? '...' : ''}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-[#6B7280] truncate block max-w-[140px]">
                        {q.macro_category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium capitalize ${
                        q.difficulty === 'hard' ? 'text-red-600' : q.difficulty === 'medium' ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[q.status] || 'bg-gray-100 text-gray-700'}`}>
                        {(q.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-0.5 text-sm">
                        <span title="English">🇬🇧</span>
                        {q.question_fr && <span title="French">🇫🇷</span>}
                        {q.question_it && <span title="Italian">🇮🇹</span>}
                        {q.question_es && <span title="Spanish">🇪🇸</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-[#6B7280] capitalize">{q.source}</span>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {q.status === 'pending_review' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                quickStatusChange(q.id, 'approved')
                              }}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 cursor-pointer transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={16} className="pointer-events-none" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                quickStatusChange(q.id, 'rejected')
                              }}
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
                ))}
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
          onSaved={loadQuestions}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={loadQuestions}
        />
      )}
    </div>
  )
}
