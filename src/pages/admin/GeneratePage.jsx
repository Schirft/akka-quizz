import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../config/constants'
import { AI_SYSTEM_PROMPT, buildUserPrompt, estimateCost } from '../../config/aiPrompts'
import Card from '../../components/ui/Card'
import QuestionModal from '../../components/admin/QuestionModal'
import AISettingsPanel from '../../components/admin/AISettingsPanel'
import {
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
  ArrowRight,
  Clock,
  DollarSign,
  Trash2,
  Settings,
  Pencil,
} from 'lucide-react'

const STORAGE_KEY = 'akka_last_generation'

// FIX 2: Streaming UX — animated status messages
const GENERATION_STEPS = [
  { icon: '🧠', text: 'Analyzing startup ecosystem knowledge...' },
  { icon: '📚', text: 'Reviewing VC terminology database...' },
  { icon: '✍️', text: 'Crafting questions with real-world examples...' },
  { icon: '🔍', text: 'Validating answer plausibility...' },
  { icon: '🌍', text: 'Generating multilingual translations...' },
  { icon: '⚡', text: 'Quality checking explanations...' },
  { icon: '🎯', text: 'Ensuring difficulty calibration...' },
  { icon: '🔄', text: 'Finalizing question set...' },
]

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
  const [visibleCount, setVisibleCount] = useState(0)
  const [batchId, setBatchId] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const abortRef = useRef(false)

  // FIX 2: Streaming UX state
  const [stepIndex, setStepIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const stepTimerRef = useRef(null)
  const elapsedTimerRef = useRef(null)

  // FIX 3: Edit modal for generated questions
  const [editQuestion, setEditQuestion] = useState(null)

  // FIX 10: AI Settings
  const [showSettings, setShowSettings] = useState(false)
  const [customPrompt, setCustomPrompt] = useState(null) // null = not loaded yet
  const [promptLoaded, setPromptLoaded] = useState(false)

  // FIX 1: Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.generated?.length > 0) {
          setGenerated(data.generated)
          setVisibleCount(data.generated.length)
          setSummary(data.summary || null)
          setBatchId(data.batchId || null)
        }
      }
    } catch {}
  }, [])

  // FIX 1: Persist to localStorage whenever generated changes
  useEffect(() => {
    if (generated.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          generated,
          summary,
          batchId,
          savedAt: Date.now(),
        }))
      } catch {}
    }
  }, [generated, summary, batchId])

  // FIX 10: Load custom prompt on mount
  useEffect(() => {
    async function loadPrompt() {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'custom_system_prompt')
          .single()
        if (data?.value) setCustomPrompt(data.value)
      } catch {}
      setPromptLoaded(true)
    }
    loadPrompt()
  }, [])

  // Export generating state for AdminLayout nav indicator
  useEffect(() => {
    if (generating) {
      window.__akka_generating = true
    } else {
      window.__akka_generating = false
    }
    // Dispatch a custom event so AdminLayout can react
    window.dispatchEvent(new Event('akka-gen-state'))
    return () => { window.__akka_generating = false }
  }, [generating])

  function toggleLang(code) {
    if (code === 'en') return
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    )
  }

  function clearResults() {
    setGenerated([])
    setVisibleCount(0)
    setSummary(null)
    setBatchId(null)
    setError(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // FIX 2: Start/stop animated status messages
  function startStreamingUX() {
    setStepIndex(0)
    setElapsed(0)
    stepTimerRef.current = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % GENERATION_STEPS.length)
    }, 3000)
    elapsedTimerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
  }

  function stopStreamingUX() {
    clearInterval(stepTimerRef.current)
    clearInterval(elapsedTimerRef.current)
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
    setVisibleCount(0)
    startStreamingUX()

    const startTime = Date.now()

    // FIX 10: Use custom prompt if available
    const systemPrompt = customPrompt || AI_SYSTEM_PROMPT

    // FIX 2: Performance — single call for ≤10, parallel 2 calls for >10
    const MAX_PER_CALL = 10
    const chunks = []
    if (count <= MAX_PER_CALL) {
      chunks.push(count)
    } else {
      const half = Math.ceil(count / 2)
      chunks.push(half)
      chunks.push(count - half)
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
          status: 'in_progress',
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
      stopStreamingUX()
      return
    }

    let allGenerated = []
    let totalInputTokens = 0
    let totalOutputTokens = 0

    // FIX 2: Build prompts for each chunk
    const chunkPromises = chunks.map((chunkCount) => {
      const userPrompt = buildUserPrompt({
        count: chunkCount,
        mode,
        category,
        theme,
        difficulty,
        languages,
      })
      // Reduce max_tokens for small counts
      const maxTokens = chunkCount <= 5 ? 4096 : 8000
      return fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })
    })

    try {
      // FIX 2: For ≤10 single call, for >10 parallel 2 calls
      const responses = await Promise.all(chunkPromises)

      for (const response of responses) {
        if (abortRef.current) break

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(`API error ${response.status}: ${errData.error?.message || 'Unknown'}`)
        }

        const data = await response.json()
        const text = data.content?.[0]?.text || ''

        totalInputTokens += data.usage?.input_tokens || 0
        totalOutputTokens += data.usage?.output_tokens || 0

        // Parse JSON array from response
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) throw new Error('No JSON array found in response')

        const parsed = JSON.parse(jsonMatch[0])
        if (!Array.isArray(parsed)) throw new Error('Parsed result is not an array')

        // FIX 2: Parallel Supabase inserts — build all payloads, then batch insert
        const insertPayloads = []
        const prefixes = []

        for (const q of parsed) {
          const prefix = (q.question_en || '').slice(0, 50)
          prefixes.push(prefix)
          insertPayloads.push({
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
          })
        }

        // Duplicate check — batch query all prefixes at once
        const dupeSet = new Set()
        if (prefixes.filter(Boolean).length > 0) {
          // Check each prefix (Supabase doesn't support OR ilike natively in batch)
          const dupeChecks = await Promise.all(
            prefixes.filter(Boolean).map((p) =>
              supabase.from('questions').select('id').ilike('question_en', `${p}%`).limit(1)
            )
          )
          dupeChecks.forEach((res, idx) => {
            if (res.data?.length > 0) dupeSet.add(idx)
          })
        }

        // Filter out duplicates and insert remaining
        const toInsert = insertPayloads.filter((_, idx) => !dupeSet.has(idx))

        if (toInsert.length > 0) {
          const { data: inserted, error: iErr } = await supabase
            .from('questions')
            .insert(toInsert)
            .select()

          if (!iErr && inserted) {
            allGenerated = [...allGenerated, ...inserted]
            setGenerated((prev) => [...prev, ...inserted])
            setProgress({ done: allGenerated.length, total: count })
            // FIX 2: Staggered 300ms slide-in for results
            inserted.forEach((_, qi) => {
              setTimeout(() => {
                setVisibleCount((v) => v + 1)
              }, qi * 300)
            })
          }
        }

        // Update progress for skipped dupes
        setProgress({ done: allGenerated.length + dupeSet.size, total: count })
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message)
    }

    stopStreamingUX()

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

    setVisibleCount(allGenerated.length)
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

  // FIX 3: After editing a generated question, update in the list
  function handleQuestionSaved() {
    // Reload the question from supabase
    if (editQuestion?.id) {
      supabase
        .from('questions')
        .select('*')
        .eq('id', editQuestion.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setGenerated((prev) =>
              prev.map((q) => (q.id === data.id ? data : q))
            )
          }
        })
    }
  }

  const pendingCount = generated.filter((q) => q.status === 'pending_review').length
  const currentStep = GENERATION_STEPS[stepIndex]

  // FIX 2: Format elapsed time
  function formatElapsed(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">AI Generator</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Generate quiz questions using Claude AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* FIX 10: Custom prompt badge */}
          {promptLoaded && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              customPrompt
                ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {customPrompt ? '✏️ Custom Prompt' : '✅ Default Prompt'}
            </span>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#D1D5DB] text-[#6B7280] text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Settings size={16} />
            AI Settings
          </button>
        </div>
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

          {/* FIX 1: Clear results button */}
          {!generating && generated.length > 0 && (
            <button
              onClick={clearResults}
              className="w-full mt-2 flex items-center justify-center gap-1.5 px-4 py-2 text-sm text-[#6B7280] font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
              Clear Results
            </button>
          )}
        </Card>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* FIX 2: Streaming progress with animated messages */}
          {generating && (
            <Card className="overflow-hidden">
              {/* Animated status message */}
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl animate-bounce">{currentStep.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1A1A1A] transition-all">
                    {currentStep.text}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {progress.done}/{progress.total} questions ready · {formatElapsed(elapsed)}
                  </p>
                </div>
                <Loader2 size={16} className="text-[#2ECC71] animate-spin" />
              </div>
              {/* Smooth progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] h-2.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress.total ? Math.max(5, (progress.done / progress.total) * 100) : 5}%` }}
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
                {generated.map((q, idx) => (
                  <div
                    key={q.id}
                    onClick={() => setEditQuestion(q)}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 cursor-pointer transition-all duration-300 ${
                      idx < visibleCount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
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
                    <div className="flex items-center gap-1">
                      {/* FIX 3: Edit icon */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditQuestion(q) }}
                        className="p-1.5 rounded-lg text-[#6B7280] hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      {q.status === 'pending_review' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); quickAction(q.id, 'approved') }}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); quickAction(q.id, 'rejected') }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
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

      {/* FIX 3: QuestionModal for editing generated questions */}
      {editQuestion && (
        <QuestionModal
          question={editQuestion}
          onClose={() => setEditQuestion(null)}
          onSaved={handleQuestionSaved}
        />
      )}

      {/* FIX 10: AI Settings Panel */}
      {showSettings && (
        <AISettingsPanel
          onClose={() => setShowSettings(false)}
          currentPrompt={customPrompt}
          onPromptChanged={(newPrompt) => setCustomPrompt(newPrompt)}
        />
      )}
    </div>
  )
}
