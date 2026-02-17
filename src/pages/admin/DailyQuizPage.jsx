import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Calendar, Loader2, Plus, X, Shuffle, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * DailyQuizPage — manage daily quiz assignments (5 questions per day).
 * Supports: view week, add/remove individual questions, auto-fill from approved pool.
 */
export default function DailyQuizPage() {
  const { user } = useAuth()
  const [weekOffset, setWeekOffset] = useState(0)
  const [quizDays, setQuizDays] = useState({})
  const [questionBank, setQuestionBank] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  // Compute the 7 day-keys for the current week view
  function getWeekDays(offset) {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }

  const weekDays = getWeekDays(weekOffset)

  // Load quiz data for the displayed week
  useEffect(() => {
    loadData()
  }, [weekOffset])

  async function loadData() {
    setLoading(true)
    try {
      // Fetch daily_quizzes for this week
      const { data: quizzes, error } = await supabase
        .from('daily_quizzes')
        .select('*')
        .in('quiz_date', weekDays)

      if (error) {
        console.error('Error loading quizzes:', error)
        setLoading(false)
        return
      }

      // Build a map: date -> quiz row
      const dayMap = {}
      for (const q of quizzes || []) {
        dayMap[q.quiz_date] = q
      }

      // Collect all non-null question IDs to fetch their details
      const allQIds = new Set()
      for (const q of quizzes || []) {
        for (let i = 1; i <= 5; i++) {
          const qid = q[`question_${i}_id`]
          if (qid) allQIds.add(qid)
        }
      }

      // Fetch question details
      const qBank = {}
      if (allQIds.size > 0) {
        const { data: questions } = await supabase
          .from('questions')
          .select('id, question_en, topic, difficulty, macro_category')
          .in('id', Array.from(allQIds))

        for (const q of questions || []) {
          qBank[q.id] = q
        }
      }

      setQuizDays(dayMap)
      setQuestionBank(qBank)
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Remove a single question from a day's quiz.
   * Shifts remaining questions left and nulls the last slot.
   */
  async function removeOneQuestion(dayKey, questionIndex) {
    console.log('removeOneQuestion called', dayKey, questionIndex)
    const day = quizDays[dayKey]
    if (!day) {
      console.error('No quiz found for day:', dayKey)
      return
    }

    setSaving(dayKey)

    // Collect current question IDs
    const currentIds = [
      day.question_1_id,
      day.question_2_id,
      day.question_3_id,
      day.question_4_id,
      day.question_5_id,
    ]

    // Remove the element at the given index
    currentIds.splice(questionIndex, 1)

    // Pad with null to keep 5 slots
    while (currentIds.length < 5) {
      currentIds.push(null)
    }

    const updateData = {
      question_1_id: currentIds[0],
      question_2_id: currentIds[1],
      question_3_id: currentIds[2],
      question_4_id: currentIds[3],
      question_5_id: currentIds[4],
    }

    const { error } = await supabase
      .from('daily_quizzes')
      .update(updateData)
      .eq('quiz_date', dayKey)

    if (error) {
      console.error('Error removing question:', error)
    } else {
      console.log('Question removed successfully, reloading...')
      await loadData()
    }

    setSaving(null)
  }

  /**
   * Auto-fill a day with 5 random approved questions that aren't already assigned.
   */
  async function autoFillDay(dayKey) {
    console.log('autoFillDay called', dayKey)
    setSaving(dayKey)

    try {
      // Get all already-assigned question IDs for this week to avoid duplicates
      const usedIds = new Set()
      for (const d of weekDays) {
        const quiz = quizDays[d]
        if (quiz) {
          for (let i = 1; i <= 5; i++) {
            const qid = quiz[`question_${i}_id`]
            if (qid) usedIds.add(qid)
          }
        }
      }

      // Fetch approved questions not in the used set
      let query = supabase
        .from('questions')
        .select('id')
        .eq('status', 'approved')
        .order('times_served', { ascending: true })
        .limit(50)

      const { data: pool } = await query

      // Filter out used ones and pick 5
      const available = (pool || []).filter((q) => !usedIds.has(q.id))
      const picked = available.slice(0, 5)

      const ids = picked.map((q) => q.id)
      while (ids.length < 5) ids.push(null)

      const row = {
        quiz_date: dayKey,
        question_1_id: ids[0],
        question_2_id: ids[1],
        question_3_id: ids[2],
        question_4_id: ids[3],
        question_5_id: ids[4],
        auto_generated: true,
        created_by: user?.id || null,
      }

      // Upsert — insert or update if exists
      const existing = quizDays[dayKey]
      if (existing) {
        await supabase
          .from('daily_quizzes')
          .update({
            question_1_id: ids[0],
            question_2_id: ids[1],
            question_3_id: ids[2],
            question_4_id: ids[3],
            question_5_id: ids[4],
            auto_generated: true,
          })
          .eq('quiz_date', dayKey)
      } else {
        await supabase.from('daily_quizzes').insert(row)
      }

      await loadData()
    } catch (err) {
      console.error('Auto-fill error:', err)
    }

    setSaving(null)
  }

  // Format day label
  function formatDayLabel(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
  }

  // Is today?
  function isToday(dateStr) {
    return dateStr === new Date().toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-akka-green" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-akka-text mb-6">Daily Quiz Planner</h1>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={20} className="text-akka-text-secondary" />
        </button>
        <div className="text-sm font-semibold text-akka-text">
          {formatDayLabel(weekDays[0])} — {formatDayLabel(weekDays[6])}
        </div>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={20} className="text-akka-text-secondary" />
        </button>
      </div>

      {/* Today button */}
      {weekOffset !== 0 && (
        <button
          onClick={() => setWeekOffset(0)}
          className="text-xs text-akka-green font-semibold mb-4 block mx-auto"
        >
          Back to this week
        </button>
      )}

      {/* Day cards */}
      <div className="space-y-3">
        {weekDays.map((dayKey) => {
          const quiz = quizDays[dayKey]
          const questionIds = quiz
            ? [
                quiz.question_1_id,
                quiz.question_2_id,
                quiz.question_3_id,
                quiz.question_4_id,
                quiz.question_5_id,
              ]
            : [null, null, null, null, null]

          const filledCount = questionIds.filter(Boolean).length
          const isSaving = saving === dayKey

          return (
            <Card
              key={dayKey}
              className={isToday(dayKey) ? 'border-akka-green border-2' : ''}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-akka-text-secondary" />
                  <span className="text-sm font-bold text-akka-text">
                    {formatDayLabel(dayKey)}
                    {isToday(dayKey) && (
                      <span className="ml-2 text-xs text-akka-green font-semibold">TODAY</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-akka-text-secondary">
                    {filledCount}/5
                  </span>
                  <button
                    onClick={() => autoFillDay(dayKey)}
                    disabled={isSaving}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-akka-text-secondary hover:text-akka-green"
                    title="Auto-fill with random questions"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Shuffle size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Question slots */}
              <div className="space-y-1.5">
                {questionIds.map((qid, index) => {
                  const question = qid ? questionBank[qid] : null
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                        question
                          ? 'bg-gray-50'
                          : 'bg-gray-50/50 border border-dashed border-gray-200'
                      }`}
                    >
                      <span className="text-akka-text-secondary font-mono w-4">
                        {index + 1}.
                      </span>
                      {question ? (
                        <>
                          <span className="flex-1 text-akka-text truncate">
                            {question.question_en}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              question.difficulty === 'easy'
                                ? 'bg-green-100 text-green-700'
                                : question.difficulty === 'hard'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {question.difficulty}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeOneQuestion(dayKey, index)
                            }}
                            className="text-red-400 hover:text-red-300 ml-2 p-1"
                            title="Remove this question"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <span className="flex-1 text-akka-text-secondary italic">
                          Empty slot
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
