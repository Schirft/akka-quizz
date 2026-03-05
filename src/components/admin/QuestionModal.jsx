import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../config/constants'
import { AI_SYSTEM_PROMPT } from '../../config/aiPrompts'
import { X, Loader2 } from 'lucide-react'

const LANG_TABS = [
  { code: 'en', label: 'EN', flag: '' },
  { code: 'fr', label: 'FR', flag: '' },
  { code: 'it', label: 'IT', flag: '' },
  { code: 'es', label: 'ES', flag: '' },
]

const DIFFICULTIES = ['easy', 'medium', 'hard']
const STATUSES = ['approved', 'pending_review', 'rejected']

const DIFF_COLORS = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
}

const emptyQuestion = {
  question_en: '', question_fr: '', question_it: '', question_es: '',
  answers_en: ['', '', '', ''], answers_fr: ['', '', '', ''],
  answers_it: ['', '', '', ''], answers_es: ['', '', '', ''],
  explanation_en: '', explanation_fr: '', explanation_it: '', explanation_es: '',
  correct_answer_index: 1,
  macro_category: CATEGORIES[0],
  sub_category: '',
  topic: '',
  difficulty: 'medium',
  status: 'pending_review',
}

/**
 * QuestionModal — edit/create question with language tabs.
 * FIX 4: Larger modal, better design, character counters, colored answers.
 * FIX 7: Save feedback toast + spinner.
 */
export default function QuestionModal({ question, onClose, onSaved }) {
  const isNew = !question?.id
  const [form, setForm] = useState(() => {
    if (question?.id) {
      return {
        ...emptyQuestion,
        ...question,
        answers_en: Array.isArray(question.answers_en) ? [...question.answers_en] : ['', '', '', ''],
        answers_fr: Array.isArray(question.answers_fr) ? [...question.answers_fr] : ['', '', '', ''],
        answers_it: Array.isArray(question.answers_it) ? [...question.answers_it] : ['', '', '', ''],
        answers_es: Array.isArray(question.answers_es) ? [...question.answers_es] : ['', '', '', ''],
      }
    }
    return { ...emptyQuestion }
  })
  const [activeLang, setActiveLang] = useState('en')
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState(null)
  // FIX 7: Save feedback toast
  const [showToast, setShowToast] = useState(false)

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateAnswer(lang, index, value) {
    setForm((prev) => {
      const key = `answers_${lang}`
      const arr = [...(prev[key] || ['', '', '', ''])]
      arr[index] = value
      return { ...prev, [key]: arr }
    })
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const payload = {
        question_en: form.question_en,
        question_fr: form.question_fr || null,
        question_it: form.question_it || null,
        question_es: form.question_es || null,
        answers_en: form.answers_en,
        answers_fr: form.answers_fr?.some(a => a) ? form.answers_fr : null,
        answers_it: form.answers_it?.some(a => a) ? form.answers_it : null,
        answers_es: form.answers_es?.some(a => a) ? form.answers_es : null,
        explanation_en: form.explanation_en,
        explanation_fr: form.explanation_fr || null,
        explanation_it: form.explanation_it || null,
        explanation_es: form.explanation_es || null,
        correct_answer_index: form.correct_answer_index,
        macro_category: form.macro_category,
        sub_category: form.sub_category || null,
        topic: form.topic || null,
        difficulty: form.difficulty,
        status: form.status,
      }

      if (isNew) {
        payload.source = 'manual'
        const { error: err } = await supabase.from('questions').insert(payload)
        if (err) throw err
      } else {
        payload.updated_at = new Date().toISOString()
        const { error: err } = await supabase.from('questions').update(payload).eq('id', question.id)
        if (err) throw err
      }

      // FIX 7: Show toast, then close
      setShowToast(true)
      onSaved?.()
      setTimeout(() => {
        setShowToast(false)
        onClose()
      }, 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setSaving(true)
    try {
      const { error: err } = await supabase.from('questions').delete().eq('id', question.id)
      if (err) throw err
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTranslate() {
    if (!form.question_en || !import.meta.env.VITE_ANTHROPIC_API_KEY) {
      setError('English question required and API key must be set')
      return
    }
    setTranslating(true)
    setError(null)
    try {
      const prompt = `Translate this quiz question from English to French, Italian, and Spanish. Return ONLY a JSON object with these fields:
{
  "question_fr": "...",
  "question_it": "...",
  "question_es": "...",
  "explanation_fr": "...",
  "explanation_it": "...",
  "explanation_es": "...",
  "answers_fr": ["...", "...", "...", "..."],
  "answers_it": ["...", "...", "...", "..."],
  "answers_es": ["...", "...", "...", "..."]
}

Question: ${form.question_en}
Answers: ${JSON.stringify(form.answers_en)}
Explanation: ${form.explanation_en}

IMPORTANT: Keep the same answer order. Translations must be native-quality.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      const text = data.content?.[0]?.text || ''

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Could not parse translation response')

      const translations = JSON.parse(jsonMatch[0])
      setForm((prev) => ({
        ...prev,
        question_fr: translations.question_fr || prev.question_fr,
        question_it: translations.question_it || prev.question_it,
        question_es: translations.question_es || prev.question_es,
        explanation_fr: translations.explanation_fr || prev.explanation_fr,
        explanation_it: translations.explanation_it || prev.explanation_it,
        explanation_es: translations.explanation_es || prev.explanation_es,
        answers_fr: translations.answers_fr || prev.answers_fr,
        answers_it: translations.answers_it || prev.answers_it,
        answers_es: translations.answers_es || prev.answers_es,
      }))
    } catch (err) {
      setError('Translation failed: ' + err.message)
    } finally {
      setTranslating(false)
    }
  }

  const qKey = `question_${activeLang}`
  const aKey = `answers_${activeLang}`
  const eKey = `explanation_${activeLang}`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8 px-4">
      {/* FIX 4: Wider modal max-w-3xl */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl">
        {/* Header with badges — FIX 4 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1D5DB]">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#1A1A1A]">
              {isNew ? 'New Question' : 'Edit Question'}
            </h2>
            {/* FIX 4: Category & difficulty badges in header */}
            {!isNew && (
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 truncate max-w-[150px]">
                  {form.macro_category}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${DIFF_COLORS[form.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                  {form.difficulty}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#1A1A1A] p-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* FIX 7: Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>
          )}

          {/* FIX 7: Success toast */}
          {showToast && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2 border border-green-200">
              Question saved ✓
            </div>
          )}

          {/* Language tabs */}
          <div className="flex gap-1 mb-4">
            {LANG_TABS.map(({ code, label, flag }) => (
              <button
                key={code}
                onClick={() => setActiveLang(code)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeLang === code
                    ? 'bg-[#1B3D2F] text-white'
                    : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                }`}
              >
                {flag} {label}
              </button>
            ))}
            <button
              onClick={handleTranslate}
              disabled={translating || !form.question_en}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              {translating && <Loader2 size={14} className="animate-spin" />}
              Translate with AI
            </button>
          </div>

          {/* FIX 4: Visual separator */}
          <div className="h-px bg-gray-100 mb-4" />

          {/* Question + character counter */}
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Question ({activeLang.toUpperCase()})
            </label>
            <span className={`text-xs ${(form[qKey] || '').length > 200 ? 'text-red-500' : 'text-[#6B7280]'}`}>
              {(form[qKey] || '').length}/200
            </span>
          </div>
          <textarea
            value={form[qKey] || ''}
            onChange={(e) => updateField(qKey, e.target.value)}
            rows={3}
            className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71] mb-4 resize-none"
            placeholder={`Enter question in ${activeLang.toUpperCase()}...`}
          />

          {/* 4 Answers — FIX 4: Colored correct answer */}
          <label className="block mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Answers ({activeLang.toUpperCase()})
          </label>
          <div className="space-y-2 mb-4">
            {[0, 1, 2, 3].map((i) => {
              const isCorrect = form.correct_answer_index === i + 1
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isCorrect ? 'bg-green-50 border border-green-200' : 'bg-white'
                  }`}
                >
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="correct"
                      checked={isCorrect}
                      onChange={() => updateField('correct_answer_index', i + 1)}
                      className="accent-[#2ECC71]"
                    />
                    <span className={`text-xs font-bold w-5 text-center ${isCorrect ? 'text-[#2ECC71]' : 'text-[#6B7280]'}`}>
                      {isCorrect ? '✓' : i + 1}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={(form[aKey] || ['', '', '', ''])[i] || ''}
                    onChange={(e) => updateAnswer(activeLang, i, e.target.value)}
                    className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71] ${
                      isCorrect ? 'border-green-300 bg-white' : 'border-[#D1D5DB]'
                    }`}
                    placeholder={`Answer ${i + 1}`}
                  />
                  {/* FIX 4: Character counter for answers */}
                  <span className="text-[10px] text-[#6B7280] w-8 text-right">
                    {((form[aKey] || ['', '', '', ''])[i] || '').length}
                  </span>
                </div>
              )
            })}
          </div>

          {/* FIX 4: Visual separator */}
          <div className="h-px bg-gray-100 mb-4" />

          {/* Explanation — FIX 4: Larger textarea */}
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Explanation ({activeLang.toUpperCase()})
            </label>
            <span className="text-xs text-[#6B7280]">
              {(form[eKey] || '').length} chars
            </span>
          </div>
          <textarea
            value={form[eKey] || ''}
            onChange={(e) => updateField(eKey, e.target.value)}
            rows={4}
            className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71] mb-4 resize-none min-h-[120px]"
            placeholder={`Explanation in ${activeLang.toUpperCase()}...`}
          />

          {/* FIX 4: Visual separator */}
          <div className="h-px bg-gray-100 mb-4" />

          {/* Metadata row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Macro Category
              </label>
              <select
                value={form.macro_category}
                onChange={(e) => updateField('macro_category', e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => updateField('difficulty', e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71] capitalize"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d} className="capitalize">{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Sub Category
              </label>
              <input
                type="text"
                value={form.sub_category || ''}
                onChange={(e) => updateField('sub_category', e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                placeholder="e.g. Venture Capital"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Topic
              </label>
              <input
                type="text"
                value={form.topic || ''}
                onChange={(e) => updateField('topic', e.target.value)}
                className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
                placeholder="e.g. Series A"
              />
            </div>
          </div>

          {/* Status */}
          <label className="block mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Status
          </label>
          <div className="flex gap-2 mb-4">
            {STATUSES.map((s) => {
              const colors = {
                approved: 'bg-green-100 text-green-700 border-green-200',
                pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
                rejected: 'bg-red-100 text-red-700 border-red-200',
              }
              return (
                <button
                  key={s}
                  onClick={() => updateField('status', s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.status === s
                      ? colors[s] + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-50 text-[#6B7280] border-gray-200'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#D1D5DB]">
          <div>
            {!isNew && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                {confirmDelete ? 'Confirm Delete' : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#6B7280] hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.question_en}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
