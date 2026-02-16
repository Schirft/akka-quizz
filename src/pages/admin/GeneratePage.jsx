import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../config/constants'
import { AI_SYSTEM_PROMPT, buildUserPrompt, estimateCost } from '../../config/aiPrompts'
import Card from '../../components/ui/Card'
import {
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  ArrowRight,
  Clock,
  DollarSign,
} from 'lucide-react'

const MAX_PER_CALL = 5 // Max questions per API call for JSON reliability

export default function GeneratePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Form state
  const [count, setCount] = useState(5)
  const [mode, setMode] = useState('auto')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [theme, setTheme] = useState('')
  const [difficulty, setDifficulty] = useState('mix')
  const [languages, setLanguages] = useState(['en', 'fr', 'it', 'es'])

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [generated, setGenerated] = useState([])
  const [batchId, setBatchId] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const abortRef = useRef(false)

  function toggleLang(code) {
    if (code === 'en') return // EN always required
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    )
  }

  async function handleGenerate() {
    if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
      setError('VITE_ANTHROPIC_API_KEY is not set in .env.local')
      return
    }

    setGenerating(true)
    setError(null)
    setGenerated([])
    setSummary(null)
    abortRef.current = false

    const startTime = Date.now()
    const chunks = []
    let remaining = count
    while (remaining > 0) {
      const chunkSize = Math.min(remaining, MAX_PER_CALL)
      chunks.push(chunkSize)
      remaining -= chunkSize
    }

    setProgress({ done: 0, total: count })

    // Create batch record
    let batchRecord = null
    try {
      const { data, error: bErr } = await supabase
        .from('ai_generation_batches')
        .insert({
          requested_count: count,
          mode,
          category: mode === 'category' ? category : null,
          theme: mode === 'theme' ? theme : null,
          difficulty: difficulty !== 'mix' ? difficulty : null,
          languages,
          generated_count: 0,
          status: 'running',
          created_by: user?.id || null,
        })
        .select()
        .single()

      if (bErr) throw bErr
      batchRecord = data
      setBatchId(data.id)
    } catch (err) {
      setError('Failed to create batch: ' + err.message)
      setGenerating(false)
      return
    }

    let allGenerated = []
    let totalInputTokens = 0
    let totalOutputTokens = 0

    for (let i = 0; i < chunks.length; i++) {
      if (abortRef.current) break

      const chunkCount = chunks[i]
      const userPrompt = buildUserPrompt({
        count: chunkCount,
        mode,
        category,
        theme,
        difficulty,
        languages,
      })

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250514',
            max_tokens: 8000,
            system: AI_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(`API error ${response.status}: ${errData.error?.message || 'Unknown'}`)
        }

        const data = await response.json()
        const text = data.content?.[0]?.text || ''

        // Track tokens
        totalInputTokens += data.usage?.input_tokens || 0
        totalOutputTokens += data.usage?.output_tokens || 0

        // Parse JSON array from response
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) throw new Error('No JSON array found in response')

        const parsed = JSON.parse(jsonMatch[0])
        if (!Array.isArray(parsed)) throw new Error('Parsed result is not an array')

        // Insert each question into Supabase
        for (const q of parsed) {
          if (abortRef.current) break

          const insertData = {
            question_en: q.question_en,
            question_fr: q.question_fr || null,
            question_it: q.question_it || null,
            question_es: q.question_es || null,
            answers_en: q.answers_en,
            answers_fr: q.answers_fr || null,
            answers_it: q.answers_it || null,
            answers_es: q.answers_es || null,
            explanation_en: q.explanation_en,
            explanation_fr: q.explanation_fr || null,
            explanation_it: q.explanation_it || null,
            explanation_es: q.explanation_es || null,
            correct_answer_index: q.correct_answer_index,
            macro_category: q.macro_category,
            sub_category: q.sub_category || null,
            topic: q.topic || null,
            difficulty: q.difficulty || 'medium',
            status: 'pending_review',
            source: 'ai',
            generation_batch_id: batchRecord.id,
          }

          const { data: inserted, error: iErr } = await supabase
            .from('questions')
            .insert(insertData)
            .select()
            .single()

          if (!iErr && inserted) {
            allGenerated.push(inserted)
            setGenerated((prev) => [...prev, inserted])
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
          }
        }
      } catch (err) {
        console.error('Generation chunk error:', err)
        setError((prev) => (prev ? prev + '\n' : '') + `Chunk ${i + 1}: ${err.message}`)
      }
    }

    // Update batch record
    const duration = Math.round((Date.now() - startTime) / 1000)
    const totalCost = estimateCost(totalInputTokens, totalOutputTokens)

    try {
      await supabase
        .from('ai_generation_batches')
        .update({
          generated_count: allGenerated.length,
          total_input_tokens: totalInputTokens,
          total_output_tokens: totalOutputTokens,
          total_cost_usd: totalCost,
          duration_seconds: duration,
          status: abortRef.current ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', batchRecord.id)
    } catch (err) {
      console.error('Batch update error:', err)
    }

    setSummary({
      count: allGenerated.length,
      duration,
      cost: totalCost,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    })

    setGenerating(false)
  }

  async function approveAll() {
    const ids = generated.filter((q) => q.status === 'pending_review').map((q) => q.id)
    if (ids.length === 0) return

    try {
      await supabase
        .from('questions')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .in('id', ids)

      setGenerated((prev) =>
        prev.map((q) => (ids.includes(q.id) ? { ...q, status: 'approved' } : q))
      )

      // Update batch counts
      if (batchId) {
        await supabase
          .from('ai_generation_batches')
          .update({ approved_count: ids.length })
          .eq('id', batchId)
      }
    } catch (err) {
      setError('Approve all failed: ' + err.message)
    }
  }

  async function quickAction(id, status) {
    try {
      await supabase
        .from('questions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      setGenerated((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status } : q))
      )
    } catch (err) {
      console.error('Quick action error:', err)
    }
  }

  const pendingCount = generated.filter((q) => q.status === 'pending_review').length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">AI Generator</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Generate quiz questions using Claude AI
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Generation form */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-purple-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Settings
            </p>
          </div>

          {/* Count slider */}
          <label className="block mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Questions: {count}
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={generating}
            className="w-full mb-4 accent-[#1B3D2F]"
          />
          <div className="flex justify-between text-xs text-[#6B7280] mb-4">
            <span>1</span><span>25</span><span>50</span>
          </div>

          {/* Mode */}
          <label className="block mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Mode
          </label>
          <div className="flex gap-2 mb-4">
            {[
              { value: 'auto', label: 'Auto' },
              { value: 'category', label: 'Category' },
              { value: 'theme', label: 'Theme' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                disabled={generating}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  mode === value
                    ? 'bg-[#1B3D2F] text-white'
                    : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'category' && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={generating}
              className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {mode === 'theme' && (
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              disabled={generating}
              placeholder="e.g. AI startups in healthcare"
              className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
            />
          )}

          {/* Difficulty */}
          <label className="block mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Difficulty
          </label>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['mix', 'easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                disabled={generating}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                  difficulty === d
                    ? 'bg-[#1B3D2F] text-white'
                    : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Languages */}
          <label className="block mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            Languages
          </label>
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { code: 'en', flag: '🇬🇧' },
              { code: 'fr', flag: '🇫🇷' },
              { code: 'it', flag: '🇮🇹' },
              { code: 'es', flag: '🇪🇸' },
            ].map(({ code, flag }) => (
              <button
                key={code}
                onClick={() => toggleLang(code)}
                disabled={generating || code === 'en'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  languages.includes(code)
                    ? 'bg-[#1B3D2F] text-white'
                    : 'bg-gray-100 text-[#6B7280]'
                } ${code === 'en' ? 'opacity-80 cursor-not-allowed' : 'hover:opacity-80'}`}
              >
                {flag} {code.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || (mode === 'theme' && !theme.trim())}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1B3D2F] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                🚀 Generate
              </>
            )}
          </button>

          {generating && (
            <button
              onClick={() => { abortRef.current = true }}
              className="w-full mt-2 px-4 py-2 text-sm text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </Card>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress */}
          {generating && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {progress.done}/{progress.total} questions generated...
                </p>
                <Loader2 size={16} className="text-[#2ECC71] animate-spin" />
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-[#2ECC71] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                />
              </div>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
            </Card>
          )}

          {/* Summary */}
          {summary && (
            <Card className="border-[#2ECC71]/30 bg-emerald-50/50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-[#2ECC71]" />
                <p className="font-semibold text-[#1A1A1A]">Generation Complete</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[#F39C12]" />
                  <div>
                    <p className="text-lg font-bold text-[#1A1A1A]">{summary.count}</p>
                    <p className="text-xs text-[#6B7280]">Questions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#3498DB]" />
                  <div>
                    <p className="text-lg font-bold text-[#1A1A1A]">{summary.duration}s</p>
                    <p className="text-xs text-[#6B7280]">Duration</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={14} className="text-[#2ECC71]" />
                  <div>
                    <p className="text-lg font-bold text-[#1A1A1A]">${summary.cost.toFixed(4)}</p>
                    <p className="text-xs text-[#6B7280]">Est. Cost</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {pendingCount > 0 && (
                  <button
                    onClick={approveAll}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2ECC71] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <CheckCircle size={14} />
                    Approve All ({pendingCount})
                  </button>
                )}
                <button
                  onClick={() => navigate('/admin/questions')}
                  className="flex items-center gap-2 px-4 py-2 border border-[#D1D5DB] text-[#1A1A1A] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View in Questions
                  <ArrowRight size={14} />
                </button>
              </div>
            </Card>
          )}

          {/* Generated questions list */}
          {generated.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#D1D5DB] bg-gray-50/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Generated Questions ({generated.length})
                </p>
              </div>
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {generated.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-[#1A1A1A] truncate">
                        {q.question_en?.slice(0, 80)}{q.question_en?.length > 80 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#6B7280] truncate max-w-[150px]">
                          {q.macro_category}
                        </span>
                        <span className={`text-xs font-medium capitalize ${
                          q.difficulty === 'hard' ? 'text-red-600' : q.difficulty === 'medium' ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {q.difficulty}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          q.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : q.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {q.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    {q.status === 'pending_review' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => quickAction(q.id, 'approved')}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => quickAction(q.id, 'rejected')}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Reject"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Empty state */}
          {!generating && generated.length === 0 && !error && (
            <Card className="py-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-purple-400" />
              </div>
              <p className="text-[#6B7280] mb-1">No questions generated yet</p>
              <p className="text-sm text-[#6B7280]">Configure settings and click Generate to start</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
