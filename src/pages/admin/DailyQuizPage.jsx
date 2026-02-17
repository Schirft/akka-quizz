import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../config/constants'
import Card from '../../components/ui/Card'
import {
  Calendar,
  Shuffle,
  List,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  Plus,
  X,
} from 'lucide-react'

/**
 * Get next 7 days as YYYY-MM-DD strings.
 */
function getNext7Days() {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DailyQuizPage() {
  const { user } = useAuth()
  const [days, setDays] = useState([])
  const [quizzes, setQuizzes] = useState({}) // { 'YYYY-MM-DD': { id, questions: [...] } }
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(null)
  const [pickerDay, setPickerDay] = useState(null) // day being manually selected
  const [availableQuestions, setAvailableQuestions] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [autoSelecting, setAutoSelecting] = useState(null) // date being auto-selected
  // HOTFIX E: Single question add/remove
  const [addPickerDay, setAddPickerDay] = useState(null) // day for adding ONE question
  const [addPickerQuestions, setAddPickerQuestions] = useState([])
  const [confirmRemoveAll, setConfirmRemoveAll] = useState(null) // date awaiting confirmation

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const next7 = getNext7Days()
      setDays(next7)

      // Fetch existing quizzes for these dates
      const { data: quizData } = await supabase
        .from('daily_quizzes')
        .select('*')
        .in('quiz_date', next7)

      const quizMap = {}
      if (quizData) {
        for (const q of quizData) {
          // Fetch the 5 questions
          const qIdsRaw = [
            q.question_1_id, q.question_2_id, q.question_3_id,
            q.question_4_id, q.question_5_id,
          ]
          // Filter out null/undefined before querying — .in() with nulls can fail silently
          const qIds = qIdsRaw.filter(Boolean)
          if (qIds.length === 0) {
            quizMap[q.quiz_date] = { id: q.id, questions: [] }
            continue
          }
          const { data: questions } = await supabase
            .from('questions')
            .select('id, question_en, macro_category, difficulty')
            .in('id', qIds)

          // Order them by the original slot order (preserving position)
          const ordered = qIdsRaw.map((id) => questions?.find((qst) => qst.id === id)).filter(Boolean)
          quizMap[q.quiz_date] = { id: q.id, questions: ordered }
        }
      }

      setQuizzes(quizMap)
    } catch (err) {
      console.error('Load daily quiz error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Auto-select 5 questions: one per category if possible, prioritize unserved.
   */
  async function handleAutoSelect(date) {
    setAutoSelecting(date)
    try {
      // Get all approved questions, ordered by last_served_date (nulls first)
      const { data: allApproved } = await supabase
        .from('questions')
        .select('id, macro_category, difficulty, last_served_date, times_served')
        .eq('status', 'approved')
        .order('last_served_date', { ascending: true, nullsFirst: true })

      if (!allApproved || allApproved.length < 5) {
        alert('Not enough approved questions (need at least 5)')
        setAutoSelecting(null)
        return
      }

      // Try to pick one per category
      const selected = []
      const used = new Set()

      for (const cat of CATEGORIES) {
        const candidate = allApproved.find((q) => q.macro_category === cat && !used.has(q.id))
        if (candidate) {
          selected.push(candidate)
          used.add(candidate.id)
        }
      }

      // Fill remaining slots if we don't have 5 categories
      for (const q of allApproved) {
        if (selected.length >= 5) break
        if (!used.has(q.id)) {
          selected.push(q)
          used.add(q.id)
        }
      }

      // Save to database
      await saveQuiz(date, selected.slice(0, 5).map((q) => q.id))
    } catch (err) {
      console.error('Auto-select error:', err)
    } finally {
      setAutoSelecting(null)
    }
  }

  /**
   * Save or update a daily quiz using upsert (quiz_date has UNIQUE constraint).
   * HOTFIX E: Allow 1-5 questions (null-fill empty slots).
   */
  async function saveQuiz(date, questionIds) {
    if (questionIds.length === 0 || questionIds.length > 5) return

    try {
      // Pad to 5 with null
      const padded = [...questionIds]
      while (padded.length < 5) padded.push(null)

      const payload = {
        quiz_date: date,
        question_1_id: padded[0],
        question_2_id: padded[1],
        question_3_id: padded[2],
        question_4_id: padded[3],
        question_5_id: padded[4],
        auto_generated: true,
        created_by: user?.id || null,
      }

      // Upsert — if quiz_date already exists, update it
      const { error: upsertErr } = await supabase
        .from('daily_quizzes')
        .upsert(payload, { onConflict: 'quiz_date' })

      if (upsertErr) {
        console.error('Upsert daily quiz error:', upsertErr)
        return
      }

      // Update served counts for each question
      for (const qid of questionIds.filter(Boolean)) {
        await supabase
          .from('questions')
          .update({ last_served_date: date })
          .eq('id', qid)
      }

      // Reload
      await loadData()
    } catch (err) {
      console.error('Save quiz error:', err)
    }
  }

  /**
   * HOTFIX E: Remove a single question from a day's quiz.
   */
  async function removeOneQuestion(date, questionId) {
    console.log('removeOneQuestion called', date, questionId)
    const quiz = quizzes[date]
    if (!quiz) { console.warn('No quiz found for date', date); return }

    // Get raw IDs from the quiz record, splice out the target, pad with null
    const rawIds = [
      quiz.questions.map((q) => q.id),
    ].flat()
    const idx = rawIds.indexOf(questionId)
    if (idx === -1) { console.warn('Question not found in quiz', questionId); return }
    rawIds.splice(idx, 1)

    if (rawIds.length === 0) {
      await deleteQuiz(date)
      return
    }

    // Pad to 5 with null
    while (rawIds.length < 5) rawIds.push(null)

    try {
      const { error: uErr } = await supabase
        .from('daily_quizzes')
        .update({
          question_1_id: rawIds[0],
          question_2_id: rawIds[1],
          question_3_id: rawIds[2],
          question_4_id: rawIds[3],
          question_5_id: rawIds[4],
        })
        .eq('id', quiz.id)

      if (uErr) console.error('Remove question update error:', uErr)
      await loadData()
    } catch (err) {
      console.error('removeOneQuestion error:', err)
    }
  }

  /**
   * HOTFIX E: Open single-question picker for adding one question.
   */
  async function openAddPicker(date) {
    setAddPickerDay(date)
    const existingIds = quizzes[date]?.questions?.map((q) => q.id) || []
    const { data } = await supabase
      .from('questions')
      .select('id, question_en, macro_category, difficulty')
      .eq('status', 'approved')
      .order('last_served_date', { ascending: true, nullsFirst: true })
      .limit(100)
    // Filter out already-selected questions
    setAddPickerQuestions((data || []).filter((q) => !existingIds.includes(q.id)))
  }

  /**
   * HOTFIX E: Add a single question to a day's quiz.
   */
  async function addOneQuestion(date, questionId) {
    const existing = quizzes[date]?.questions?.map((q) => q.id) || []
    if (existing.length >= 5) return
    await saveQuiz(date, [...existing, questionId])
    setAddPickerDay(null)
  }

  /**
   * Delete a daily quiz.
   */
  async function deleteQuiz(date) {
    const existing = quizzes[date]
    if (!existing?.id) return
    await supabase.from('daily_quizzes').delete().eq('id', existing.id)
    await loadData()
  }

  /**
   * Open manual picker for a day.
   */
  async function openPicker(date) {
    setPickerDay(date)
    setSelectedIds(quizzes[date]?.questions?.map((q) => q.id) || [])

    // Load approved questions
    const { data } = await supabase
      .from('questions')
      .select('id, question_en, macro_category, difficulty')
      .eq('status', 'approved')
      .order('last_served_date', { ascending: true, nullsFirst: true })
      .limit(100)

    setAvailableQuestions(data || [])
  }

  function toggleQuestion(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  async function savePicker() {
    if (selectedIds.length === 0 || selectedIds.length > 5 || !pickerDay) return
    setSaving(true)
    await saveQuiz(pickerDay, selectedIds)
    setPickerDay(null)
    setSaving(false)
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Daily Quiz Planner</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Schedule the quiz of the day for the next 7 days
        </p>
      </div>

      {/* Calendar view */}
      <div className="space-y-3">
        {days.map((date) => {
          const d = new Date(date + 'T12:00:00')
          const dayName = DAY_NAMES[d.getDay()]
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const isToday = date === new Date().toISOString().split('T')[0]
          const quiz = quizzes[date]
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
                      {quiz ? `${quiz.questions.length} questions planned` : 'Not planned'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {quiz ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <CheckCircle size={12} />
                      Scheduled
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-[#6B7280] text-xs font-medium">
                      Empty
                    </span>
                  )}
                  {isExpanded ? <ChevronUp size={16} className="text-[#6B7280]" /> : <ChevronDown size={16} className="text-[#6B7280]" />}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  {/* Actions */}
                  <div className="flex gap-2 mt-3 mb-3">
                    <button
                      onClick={() => handleAutoSelect(date)}
                      disabled={autoSelecting === date}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#1B3D2F] text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {autoSelecting === date ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Shuffle size={14} />
                      )}
                      Auto-select
                    </button>
                    <button
                      onClick={() => openPicker(date)}
                      className="flex items-center gap-1.5 px-3 py-2 border border-[#D1D5DB] text-[#1A1A1A] text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <List size={14} />
                      Manual Select
                    </button>
                    {/* HOTFIX E: Add question button when <5 */}
                    {quiz && quiz.questions.length < 5 && (
                      <button
                        onClick={() => openAddPicker(date)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-[#2ECC71] text-[#1B3D2F] text-xs font-medium rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <Plus size={14} />
                        Add Question
                      </button>
                    )}
                    {/* HOTFIX E: Remove all with confirmation */}
                    {quiz && (
                      confirmRemoveAll === date ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-xs text-red-600 font-medium">Remove all?</span>
                          <button
                            onClick={() => { deleteQuiz(date); setConfirmRemoveAll(null) }}
                            className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmRemoveAll(null)}
                            className="px-2 py-1 text-xs text-[#6B7280] hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemoveAll(date)}
                          className="flex items-center gap-1.5 px-3 py-2 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors ml-auto"
                        >
                          <Trash2 size={14} />
                          Remove All
                        </button>
                      )
                    )}
                  </div>

                  {/* Questions */}
                  {quiz?.questions?.length > 0 ? (
                    <div className="space-y-2">
                      {quiz.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg group"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#1B3D2F] text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#1A1A1A] truncate">{q.question_en}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#6B7280] truncate max-w-[120px]">{q.macro_category}</span>
                              <span className={`text-[10px] font-medium capitalize ${
                                q.difficulty === 'hard' ? 'text-red-600' : q.difficulty === 'medium' ? 'text-amber-600' : 'text-green-600'
                              }`}>
                                {q.difficulty}
                              </span>
                            </div>
                          </div>
                          {/* HOTFIX E: Remove single question — always visible for mobile */}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeOneQuestion(date, q.id) }}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
                            title="Remove this question"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {/* HOTFIX E: Inline add button when has some but <5 */}
                      {quiz.questions.length < 5 && (
                        <button
                          onClick={() => openAddPicker(date)}
                          className="flex items-center gap-2 w-full px-3 py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-[#6B7280] hover:border-[#2ECC71] hover:text-[#1B3D2F] transition-colors"
                        >
                          <Plus size={14} />
                          Add question ({quiz.questions.length}/5)
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B7280] text-center py-4">
                      No questions selected for this day
                    </p>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Manual Selection Modal */}
      {pickerDay && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1D5DB]">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">Select 5 Questions</h2>
                <p className="text-xs text-[#6B7280]">
                  {pickerDay} — {selectedIds.length}/5 selected
                </p>
              </div>
              <button onClick={() => setPickerDay(null)} className="text-[#6B7280] hover:text-[#1A1A1A]">
                <XCircle size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {availableQuestions.map((q) => {
                const isSelected = selectedIds.includes(q.id)
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                      isSelected ? 'bg-[#2ECC71] border-[#2ECC71]' : 'border-[#D1D5DB]'
                    }`}>
                      {isSelected && <CheckCircle size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1A1A1A] truncate">{q.question_en}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#6B7280]">{q.macro_category}</span>
                        <span className={`text-[10px] font-medium capitalize ${
                          q.difficulty === 'hard' ? 'text-red-600' : q.difficulty === 'medium' ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[#1B3D2F] text-white text-xs font-bold flex items-center justify-center">
                        {selectedIds.indexOf(q.id) + 1}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-[#D1D5DB]">
              <button
                onClick={() => setPickerDay(null)}
                className="px-4 py-2 text-sm text-[#6B7280] font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePicker}
                disabled={selectedIds.length === 0 || selectedIds.length > 5 || saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save ({selectedIds.length}/5)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOTFIX E: Single Question Picker Modal */}
      {addPickerDay && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1D5DB]">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">Add a Question</h2>
                <p className="text-xs text-[#6B7280]">
                  {addPickerDay} — Pick one question to add
                </p>
              </div>
              <button onClick={() => setAddPickerDay(null)} className="text-[#6B7280] hover:text-[#1A1A1A]">
                <XCircle size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
              {addPickerQuestions.length === 0 ? (
                <p className="text-sm text-[#6B7280] text-center py-8">No available questions</p>
              ) : addPickerQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => addOneQuestion(addPickerDay, q.id)}
                  className="flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-emerald-50 transition-colors"
                >
                  <Plus size={16} className="text-[#2ECC71] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1A1A1A] truncate">{q.question_en}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#6B7280]">{q.macro_category}</span>
                      <span className={`text-[10px] font-medium capitalize ${
                        q.difficulty === 'hard' ? 'text-red-600' : q.difficulty === 'medium' ? 'text-amber-600' : 'text-green-600'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-[#D1D5DB]">
              <button
                onClick={() => setAddPickerDay(null)}
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
