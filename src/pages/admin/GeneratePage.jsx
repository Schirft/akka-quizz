import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../config/constants'
import { AI_SYSTEM_PROMPT, buildUserPrompt, buildSingleLangTranslationPrompt, estimateCost } from '../../config/aiPrompts'
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
  Play,
  Check,
  Package,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  BookOpen,
  Puzzle,
  X,
  Save,
} from 'lucide-react'

const STORAGE_KEY = 'akka_last_generation'
const STORAGE_EXPIRY = 2 * 60 * 60 * 1000 // 2 hours
const GENERATION_MODEL = 'claude-sonnet-4-5-20250929' // For generating EN questions
const TRANSLATION_MODEL = 'claude-3-5-haiku-20241022' // For translating FR/IT/ES

/* ── HOTFIX A: Robust JSON parsing ── */
function parsePartialJSON(text) {
  // Strip markdown fences
  let clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  // Try direct parse first
  try { return JSON.parse(clean) } catch {}

  // Try extracting [...] from the text
  const arrMatch = clean.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]) } catch {}
  }

  // Fix truncated array: find last complete object }, then close the array
  const lastBrace = clean.lastIndexOf('}')
  if (lastBrace > 0) {
    const slice = clean.slice(0, lastBrace + 1)
    // Find the opening bracket
    const openBracket = slice.indexOf('[')
    if (openBracket >= 0) {
      const fixed = slice.slice(openBracket) + ']'
      try { return JSON.parse(fixed) } catch {}
    }
  }

  throw new Error('Unable to parse JSON from response')
}

// Animated status messages
const STEP1_MESSAGES = [
  { icon: '🧠', text: 'Analyzing startup ecosystem knowledge...' },
  { icon: '📚', text: 'Reviewing VC terminology database...' },
  { icon: '✍️', text: 'Crafting questions with real-world examples...' },
  { icon: '🔍', text: 'Validating answer plausibility...' },
  { icon: '⚡', text: 'Quality checking explanations...' },
  { icon: '🎯', text: 'Ensuring difficulty calibration...' },
]
const STEP2_MESSAGES = [
  { icon: '🌍', text: 'Translating to target languages...' },
  { icon: '🇫🇷', text: 'Generating French translations...' },
  { icon: '🇮🇹', text: 'Generating Italian translations...' },
  { icon: '🇪🇸', text: 'Generating Spanish translations...' },
  { icon: '✨', text: 'Polishing native-quality translations...' },
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

  // Batch history — accumulates across generations in same session
  const [batchHistory, setBatchHistory] = useState([])

  // Streaming UX state
  const [stepLabel, setStepLabel] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const stepTimerRef = useRef(null)
  const elapsedTimerRef = useRef(null)
  const stepsRef = useRef(STEP1_MESSAGES)

  // Edit modal
  const [editQuestion, setEditQuestion] = useState(null)

  // AI Settings
  const [showSettings, setShowSettings] = useState(false)
  const [customPrompt, setCustomPrompt] = useState(null)
  const [promptLoaded, setPromptLoaded] = useState(false)

  // HOTFIX A: Resume state
  const [resumeInfo, setResumeInfo] = useState(null) // { resumeFrom, totalRequested, batchId, mode, category, theme, difficulty, languages }

  // Pack generation state
  const [packTheme, setPackTheme] = useState('')
  const [packDifficulty, setPackDifficulty] = useState('medium')
  const [generatingPack, setGeneratingPack] = useState(false)
  const [packResult, setPackResult] = useState(null)
  const [packError, setPackError] = useState(null)
  const [packs, setPacks] = useState([])
  const [packsLoading, setPacksLoading] = useState(true)
  const packPollRef = useRef(null)

  // Pack detail state
  const [expandedPackId, setExpandedPackId] = useState(null)
  const [packDetails, setPackDetails] = useState({}) // { packId: { questions, puzzle, lesson } }
  const [loadingPackDetail, setLoadingPackDetail] = useState(null)
  const [editingPuzzle, setEditingPuzzle] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)

  // ── Restore from localStorage on mount (with 2-hour expiry) ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        // Check 2-hour expiry
        if (data.savedAt && Date.now() - data.savedAt > STORAGE_EXPIRY) {
          localStorage.removeItem(STORAGE_KEY)
          return
        }
        if (data.generated?.length > 0) {
          setGenerated(data.generated)
          setVisibleCount(data.generated.length)
          setSummary(data.summary || null)
          setBatchId(data.batchId || null)
          // Restore resume info if incomplete
          if (data.resumeInfo) {
            setResumeInfo(data.resumeInfo)
          }
        }
        if (data.batchHistory?.length > 0) {
          setBatchHistory(data.batchHistory)
        }
      }
    } catch {}
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (generated.length > 0 || batchHistory.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          generated,
          summary,
          batchId,
          resumeInfo,
          batchHistory,
          savedAt: Date.now(),
        }))
      } catch {}
    }
  }, [generated, summary, batchId, resumeInfo, batchHistory])

  // Load custom prompt on mount (from localStorage, app_settings table removed)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('akka_custom_prompt')
      if (saved) setCustomPrompt(saved)
    } catch {}
    setPromptLoaded(true)
  }, [])

  // Export generating state for AdminLayout nav indicator
  useEffect(() => {
    window.__akka_generating = !!generating
    window.dispatchEvent(new Event('akka-gen-state'))
    return () => { window.__akka_generating = false }
  }, [generating])

  // Load packs on mount + restore pack generation state
  useEffect(() => {
    async function loadPacks() {
      const { data } = await supabase
        .from('daily_packs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      setPacks(data || [])
      setPacksLoading(false)
    }
    loadPacks()

    // Check if a pack generation was in progress (persisted in localStorage)
    try {
      const savedPack = localStorage.getItem('akka_pack_generating')
      if (savedPack) {
        const { startedAt, packCount } = JSON.parse(savedPack)
        // If older than 5 min, consider it stale
        if (Date.now() - startedAt > 5 * 60 * 1000) {
          localStorage.removeItem('akka_pack_generating')
          return
        }
        // Start polling for new packs
        setGeneratingPack(true)
        packPollRef.current = setInterval(async () => {
          const { data: latest } = await supabase
            .from('daily_packs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)
          const newPacks = latest || []
          if (newPacks.length > (packCount || 0)) {
            // Pack generation completed
            clearInterval(packPollRef.current)
            packPollRef.current = null
            localStorage.removeItem('akka_pack_generating')
            setPacks(newPacks)
            setGeneratingPack(false)
            setPackResult({ questions_count: 3, pack_id: newPacks[0]?.id })
          }
        }, 4000)
      }
    } catch {}

    return () => {
      if (packPollRef.current) clearInterval(packPollRef.current)
    }
  }, [])

  async function handleGeneratePack() {
    if (generatingPack) return
    setGeneratingPack(true)
    setPackResult(null)
    setPackError(null)

    // Persist generating state so it survives tab switches
    try {
      localStorage.setItem('akka_pack_generating', JSON.stringify({
        startedAt: Date.now(),
        packCount: packs.length,
      }))
    } catch {}

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(`${supabaseUrl}/functions/v1/generate-daily-pack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
        },
        body: JSON.stringify({
          theme: packTheme || undefined,
          difficulty: packDifficulty,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setPackError(result.error || 'Pack generation failed')
      } else {
        setPackResult(result)
        // Reload packs
        const { data } = await supabase
          .from('daily_packs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
        setPacks(data || [])
      }
    } catch (err) {
      setPackError(err.message || 'Network error')
    } finally {
      setGeneratingPack(false)
      localStorage.removeItem('akka_pack_generating')
    }
  }

  // ── Pack detail: load questions, puzzle, lesson for a pack ──
  async function loadPackDetail(pack) {
    if (packDetails[pack.id]) return // already loaded
    setLoadingPackDetail(pack.id)
    try {
      const results = {}
      // Load questions
      if (pack.question_ids?.length > 0) {
        const { data: qs } = await supabase
          .from('questions')
          .select('*')
          .in('id', pack.question_ids)
        results.questions = qs || []
      } else {
        results.questions = []
      }
      // Load puzzle
      if (pack.puzzle_id) {
        const { data: pz } = await supabase
          .from('puzzles')
          .select('*')
          .eq('id', pack.puzzle_id)
          .single()
        results.puzzle = pz || null
      } else {
        results.puzzle = null
      }
      // Load lesson
      if (pack.lesson_id) {
        const { data: ls } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', pack.lesson_id)
          .single()
        results.lesson = ls || null
      } else {
        results.lesson = null
      }
      setPackDetails(prev => ({ ...prev, [pack.id]: results }))
    } catch (err) {
      console.error('Load pack detail error:', err)
    }
    setLoadingPackDetail(null)
  }

  async function togglePackExpand(pack) {
    if (expandedPackId === pack.id) {
      setExpandedPackId(null)
      return
    }
    setExpandedPackId(pack.id)
    await loadPackDetail(pack)
  }

  async function togglePackStatus(pack) {
    const newStatus = pack.status === 'active' ? 'draft' : 'active'
    const { error: err } = await supabase
      .from('daily_packs')
      .update({ status: newStatus })
      .eq('id', pack.id)
    if (!err) {
      setPacks(prev => prev.map(p => p.id === pack.id ? { ...p, status: newStatus } : p))
    }
  }

  async function handleSavePuzzle(puzzle) {
    const { id, ...updates } = puzzle
    const { error: err } = await supabase
      .from('puzzles')
      .update(updates)
      .eq('id', id)
    if (!err) {
      // Refresh in packDetails
      setPackDetails(prev => {
        const copy = { ...prev }
        for (const pid of Object.keys(copy)) {
          if (copy[pid].puzzle?.id === id) {
            copy[pid] = { ...copy[pid], puzzle: { id, ...updates } }
          }
        }
        return copy
      })
      setEditingPuzzle(null)
    }
  }

  async function handleSaveLesson(lesson) {
    const { id, ...updates } = lesson
    const { error: err } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
    if (!err) {
      setPackDetails(prev => {
        const copy = { ...prev }
        for (const pid of Object.keys(copy)) {
          if (copy[pid].lesson?.id === id) {
            copy[pid] = { ...copy[pid], lesson: { id, ...updates } }
          }
        }
        return copy
      })
      setEditingLesson(null)
    }
  }

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
    setResumeInfo(null)
    setBatchHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  // ── Streaming UX helpers ──
  function startStreamingUX(steps, label) {
    stepsRef.current = steps
    setStepLabel(label)
    setStepIndex(0)
    setElapsed(0)
    stepTimerRef.current = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % stepsRef.current.length)
    }, 3000)
    elapsedTimerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
  }

  function switchStreamingUX(steps, label) {
    stepsRef.current = steps
    setStepLabel(label)
    setStepIndex(0)
  }

  function stopStreamingUX() {
    clearInterval(stepTimerRef.current)
    clearInterval(elapsedTimerRef.current)
  }

  function formatElapsed(secs) {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  // ── Reusable sub-batch generator: calls Claude API for N questions ──
  async function generateSubBatch({ requestCount, systemPrompt, maxTokens }) {
    const prompt = buildUserPrompt({ count: requestCount, mode, category, theme, difficulty })
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: GENERATION_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(`API error ${res.status}: ${errData.error?.message || 'Unknown'}`)
    }
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    console.log(`[GEN] Sub-batch raw response: ${text.length} chars`)
    const questions = parsePartialJSON(text)
    if (!Array.isArray(questions)) throw new Error('Parsed result is not an array')
    return {
      questions,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
    }
  }

  /* ──────────────── HOTFIX A: 2-step generation ──────────────── */
  async function handleGenerate(resumeFrom = 0) {
    if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
      setError('VITE_ANTHROPIC_API_KEY is not set in .env.local')
      return
    }

    const isResume = resumeFrom > 0
    const totalRequested = isResume ? (resumeInfo?.totalRequested || count) : count
    const effectiveBatchId = isResume ? (resumeInfo?.batchId || null) : null

    setGenerating(true)
    setError(null)
    if (!isResume) {
      // Archive current batch to history before clearing
      if (generated.length > 0 && summary) {
        setBatchHistory(prev => [{
          id: batchId || Date.now(),
          questions: generated,
          timestamp: new Date().toISOString(),
          duration: summary.duration ? `${summary.duration}s` : '—',
          cost: summary.cost ? `$${summary.cost.toFixed(4)}` : '—',
        }, ...prev])
      }
      setGenerated([])
      setSummary(null)
      setResumeInfo(null)
      setVisibleCount(0)
    }
    abortRef.current = false

    const needsTranslation = languages.some(l => l !== 'en')
    const label = needsTranslation ? 'Step 1/2 — 🧠 Generating questions in English...' : '🧠 Generating questions in English...'
    startStreamingUX(STEP1_MESSAGES, label)

    const startTime = Date.now()
    const systemPrompt = customPrompt || AI_SYSTEM_PROMPT

    setProgress({ done: resumeFrom, total: totalRequested })

    // Create batch record if new
    let batchRecord = null
    if (!isResume) {
      try {
        const { data, error: bErr } = await supabase
          .from('ai_generation_batches')
          .insert({
            requested_count: totalRequested,
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
    } else {
      batchRecord = { id: effectiveBatchId }
      setBatchId(effectiveBatchId)
    }

    let allGenerated = isResume ? [...generated] : []
    let totalInputTokens = 0
    let totalOutputTokens = 0

    try {
      // ── STEP 1: Generate EN questions in sub-batches of max 8 ──
      const SUB_BATCH_SIZE = 8
      const remaining = totalRequested - resumeFrom
      const subBatches = []
      let rem = remaining
      while (rem > 0) {
        const size = Math.min(rem, SUB_BATCH_SIZE)
        subBatches.push(size)
        rem -= size
      }
      console.log(`[GEN] Using model: ${GENERATION_MODEL}`)
      console.log(`[GEN] Will generate ${remaining} questions in ${subBatches.length} sub-batches:`, subBatches)

      let allEnQuestions = []

      for (let sIdx = 0; sIdx < subBatches.length; sIdx++) {
        if (abortRef.current) break
        const wantCount = subBatches[sIdx]
        const requestCount = wantCount + 1 // +1 to compensate LLM under-generation

        const subLabel = needsTranslation
          ? `Step 1/2 — 🧠 Generating questions (batch ${sIdx + 1}/${subBatches.length})...`
          : `🧠 Generating questions (batch ${sIdx + 1}/${subBatches.length})...`
        if (sIdx === 0) switchStreamingUX(STEP1_MESSAGES, subLabel)
        else setStepLabel(subLabel)

        console.log(`[GEN] Sub-batch ${sIdx + 1}: requesting ${requestCount} (want ${wantCount})`)
        const result = await generateSubBatch({ requestCount, systemPrompt, maxTokens: 8000 })
        totalInputTokens += result.inputTokens
        totalOutputTokens += result.outputTokens

        let subQuestions = result.questions
        console.log(`[GEN] Sub-batch ${sIdx + 1}: parsed ${subQuestions.length}/${requestCount}`)

        // Truncate to wanted count
        if (subQuestions.length > wantCount) {
          subQuestions = subQuestions.slice(0, wantCount)
        }

        // Retry if still short
        if (subQuestions.length < wantCount && !abortRef.current) {
          const missing = wantCount - subQuestions.length
          console.log(`[GEN] Sub-batch ${sIdx + 1}: retrying for ${missing} missing questions`)
          setStepLabel(`⚠️ Got ${subQuestions.length}/${wantCount}, generating ${missing} more...`)
          try {
            const retry = await generateSubBatch({ requestCount: missing + 1, systemPrompt, maxTokens: 6000 })
            totalInputTokens += retry.inputTokens
            totalOutputTokens += retry.outputTokens
            if (retry.questions.length > 0) {
              subQuestions = [...subQuestions, ...retry.questions]
            }
          } catch (retryErr) {
            console.warn(`[GEN] Retry failed:`, retryErr.message)
          }
        }

        // Final truncate
        if (subQuestions.length > wantCount) {
          subQuestions = subQuestions.slice(0, wantCount)
        }

        allEnQuestions = [...allEnQuestions, ...subQuestions]
        setProgress({ done: resumeFrom + allEnQuestions.length, total: totalRequested })
        console.log(`[GEN] Sub-batch ${sIdx + 1} done: ${subQuestions.length}/${wantCount}, total so far: ${allEnQuestions.length}`)
      }

      // Final truncate to exact requested count
      if (allEnQuestions.length > remaining) {
        allEnQuestions = allEnQuestions.slice(0, remaining)
      }
      console.log(`[GEN] All EN questions: ${allEnQuestions.length}/${remaining}`)

      // ── STEP 2: Translate ALL questions in parallel ──
      if (needsTranslation && allEnQuestions.length > 0 && !abortRef.current) {
        const langLabels = { fr: '🇫🇷 FR', it: '🇮🇹 IT', es: '🇪🇸 ES' }
        const targetLangs = languages.filter(l => l !== 'en')
        const langList = targetLangs.map(l => langLabels[l] || l).join(', ')
        console.log(`[TRANSLATE] Using model: ${TRANSLATION_MODEL}`)

        // Split into sub-batches of 8 to avoid Haiku truncating large JSON
        const TRANSLATE_BATCH_SIZE = 8
        const transChunks = []
        for (let i = 0; i < allEnQuestions.length; i += TRANSLATE_BATCH_SIZE) {
          transChunks.push(allEnQuestions.slice(i, i + TRANSLATE_BATCH_SIZE))
        }

        for (let c = 0; c < transChunks.length; c++) {
          if (abortRef.current) break
          const chunkLabel = transChunks.length > 1 ? ` (batch ${c + 1}/${transChunks.length})` : ''
          switchStreamingUX(STEP2_MESSAGES, `Step 2/2 — 🌍 Translating to ${langList}${chunkLabel}...`)

          const translationPromises = targetLangs.map(async (lang) => {
            try {
              const prompt = buildSingleLangTranslationPrompt(transChunks[c], lang)
              const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
                  'anthropic-version': '2023-06-01',
                  'anthropic-dangerous-direct-browser-access': 'true',
                },
                body: JSON.stringify({
                  model: TRANSLATION_MODEL,
                  max_tokens: 4096,
                  messages: [{ role: 'user', content: prompt }],
                }),
              })
              if (!res.ok) {
                const errBody = await res.json().catch(() => ({}))
                throw new Error(`API ${res.status}: ${errBody.error?.message || 'Unknown'}`)
              }
              const data = await res.json()
              console.log(`[TRANSLATE] ${lang} chunk ${c + 1} OK — ${data.usage?.output_tokens || 0} tokens`)
              return { lang, data }
            } catch (err) {
              console.error(`[TRANSLATE] ${lang} chunk ${c + 1} FAILED:`, err.message)
              return { lang, data: null }
            }
          })

          const results = await Promise.allSettled(translationPromises)

          for (const result of results) {
            if (result.status !== 'fulfilled' || !result.value.data) continue
            const { lang, data } = result.value
            totalInputTokens += data.usage?.input_tokens || 0
            totalOutputTokens += data.usage?.output_tokens || 0
            try {
              const transText = data.content?.[0]?.text || ''
              const translations = parsePartialJSON(transText)
              if (Array.isArray(translations)) {
                for (const tr of translations) {
                  const idx = tr.index
                  const globalIdx = c * TRANSLATE_BATCH_SIZE + idx
                  if (globalIdx >= 0 && globalIdx < allEnQuestions.length) {
                    if (tr[`question_${lang}`]) allEnQuestions[globalIdx][`question_${lang}`] = tr[`question_${lang}`]
                    if (tr[`answers_${lang}`]) allEnQuestions[globalIdx][`answers_${lang}`] = tr[`answers_${lang}`]
                    if (tr[`explanation_${lang}`]) allEnQuestions[globalIdx][`explanation_${lang}`] = tr[`explanation_${lang}`]
                  }
                }
              }
            } catch (parseErr) {
              console.warn(`Translation parse ${lang} chunk ${c + 1} failed:`, parseErr.message)
            }
          }
        }
      }

      // ── Deduplicate against existing DB questions ──
      if (allEnQuestions.length > 0) {
        const { data: existingQs } = await supabase
          .from('questions')
          .select('question_en')
          .limit(5000)

        const existingSet = new Set(
          (existingQs || []).map(q => q.question_en?.toLowerCase().trim())
        )

        const beforeCount = allEnQuestions.length
        const localSeen = new Set()
        allEnQuestions = allEnQuestions.filter(q => {
          const key = q.question_en?.toLowerCase().trim()
          if (!key || existingSet.has(key) || localSeen.has(key)) {
            console.log('[GEN] Duplicate skipped:', key?.substring(0, 50))
            return false
          }
          existingSet.add(key)
          localSeen.add(key)
          return true
        })

        const dupeCount = beforeCount - allEnQuestions.length
        if (dupeCount > 0) {
          console.log(`[GEN] ${beforeCount} generated, ${allEnQuestions.length} unique, ${dupeCount} duplicates skipped`)
          setStepLabel(`⚠️ ${dupeCount} duplicate question${dupeCount > 1 ? 's' : ''} skipped`)
        }
      }

      // ── Insert into Supabase ──
      if (allEnQuestions.length > 0 && !abortRef.current) {
        const insertPayloads = allEnQuestions.map(q => ({
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
        }))

        const { data: inserted, error: iErr } = await supabase
          .from('questions')
          .insert(insertPayloads)
          .select()

        if (!iErr && inserted) {
          allGenerated = [...allGenerated, ...inserted]
          setGenerated(prev => [...prev, ...inserted])
          setProgress({ done: allGenerated.length, total: totalRequested })
          inserted.forEach((_, qi) => {
            setTimeout(() => setVisibleCount(v => v + 1), qi * 300)
          })
        }
      }

      setProgress({ done: allGenerated.length, total: totalRequested })

    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message)
      setResumeInfo({
        resumeFrom: allGenerated.length,
        totalRequested,
        batchId: batchRecord.id,
        mode, category, theme, difficulty, languages,
      })
    }

    stopStreamingUX()

    // Update batch record
    const duration = Math.round((Date.now() - startTime) / 1000)
    const totalCost = estimateCost(totalInputTokens, totalOutputTokens)

    if (batchRecord?.id) {
      try {
        await supabase
          .from('ai_generation_batches')
          .update({
            generated_count: allGenerated.length,
            total_input_tokens: totalInputTokens,
            total_output_tokens: totalOutputTokens,
            total_cost_usd: totalCost,
            duration_seconds: duration,
            status: abortRef.current ? 'failed' : (allGenerated.length < totalRequested ? 'partial' : 'completed'),
            completed_at: new Date().toISOString(),
          })
          .eq('id', batchRecord.id)
      } catch (err) {
        console.error('Batch update error:', err)
      }
    }

    // If incomplete, set resume info
    if (allGenerated.length < totalRequested && !abortRef.current) {
      setResumeInfo({
        resumeFrom: allGenerated.length,
        totalRequested,
        batchId: batchRecord.id,
        mode, category, theme, difficulty, languages,
      })
    } else {
      setResumeInfo(null)
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

  function handleResume() {
    if (!resumeInfo) return
    // Restore form settings from resume info
    handleGenerate(resumeInfo.resumeFrom)
  }

  function keepPartial() {
    setResumeInfo(null)
    setError(null)
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

  async function approveBatch(questions) {
    const ids = questions
      .filter(q => q.status === 'pending_review')
      .map(q => q.id)
      .filter(Boolean)
    if (ids.length === 0) return

    try {
      const { error: err } = await supabase
        .from('questions')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .in('id', ids)

      if (err) {
        console.error('Approve batch error:', err)
        return
      }

      // Update current batch
      setGenerated(prev => prev.map(q => ids.includes(q.id) ? { ...q, status: 'approved' } : q))
      // Update archived batches
      setBatchHistory(prev => prev.map(batch => ({
        ...batch,
        questions: batch.questions.map(q => ids.includes(q.id) ? { ...q, status: 'approved' } : q),
      })))
    } catch (err) {
      console.error('Approve batch error:', err)
    }
  }

  async function quickAction(id, status) {
    console.log(`[ACTION] ${status} clicked for question:`, id)
    try {
      await supabase
        .from('questions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      // Update current batch
      setGenerated((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status } : q))
      )
      // Update archived batches too
      setBatchHistory((prev) =>
        prev.map((batch) => ({
          ...batch,
          questions: batch.questions.map((q) => (q.id === id ? { ...q, status } : q)),
        }))
      )
    } catch (err) {
      console.error('Quick action error:', err)
    }
  }

  function handleQuestionSaved() {
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
            // Also refresh in archived batches
            setBatchHistory((prev) =>
              prev.map((batch) => ({
                ...batch,
                questions: batch.questions.map((q) => (q.id === data.id ? data : q)),
              }))
            )
          }
        })
    }
  }

  const pendingCount = generated.filter((q) => q.status === 'pending_review').length
  const currentSteps = stepsRef.current
  const currentStep = currentSteps[stepIndex % currentSteps.length] || currentSteps[0]

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

      {/* ── Generate Daily Pack Section ── */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Package size={18} className="text-purple-500" />
          <h2 className="text-base font-bold text-[#1A1A1A]">Generate Daily Pack</h2>
          <span className="text-xs text-[#6B7280]">(3 QCM + Puzzle + Lesson)</span>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Theme
            </label>
            <select
              value={packTheme}
              onChange={(e) => setPackTheme(e.target.value)}
              disabled={generatingPack}
              className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
            >
              <option value="">Auto (random theme)</option>
              <option value="Fundraising">Fundraising</option>
              <option value="Cap Tables">Cap Tables</option>
              <option value="Term Sheets & Legal">Term Sheets & Legal</option>
              <option value="Unit Economics">Unit Economics</option>
              <option value="Revenue & Growth">Revenue & Growth</option>
              <option value="Burn Analysis">Burn Analysis</option>
              <option value="Market & Comps">Market & Comps</option>
            </select>
          </div>
          <div className="w-36">
            <label className="block mb-1 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
              Difficulty
            </label>
            <select
              value={packDifficulty}
              onChange={(e) => setPackDifficulty(e.target.value)}
              disabled={generatingPack}
              className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2ECC71]"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <button
            onClick={handleGeneratePack}
            disabled={generatingPack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {generatingPack ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Pack
              </>
            )}
          </button>
        </div>

        {packError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-3">
            {packError}
          </div>
        )}

        {packResult && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 mb-3">
            Pack created! {packResult.questions_count} questions + 1 puzzle + 1 lesson
            {packResult.pack_id && <span className="text-xs text-green-500 ml-2">(ID: {packResult.pack_id.slice(0, 8)}...)</span>}
          </div>
        )}

        {/* Pack list — expandable */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] mb-2">
            Recent Packs ({packs.length})
          </p>
          {packsLoading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 size={14} className="animate-spin text-[#6B7280]" />
              <span className="text-sm text-[#6B7280]">Loading packs...</span>
            </div>
          ) : packs.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-2">No packs yet. Generate your first one above!</p>
          ) : (
            <div className="space-y-2">
              {packs.map((p) => {
                const isExpanded = expandedPackId === p.id
                const detail = packDetails[p.id]
                return (
                  <div key={p.id} className="rounded-xl border border-gray-200 overflow-hidden">
                    {/* Pack header — click to expand */}
                    <button
                      onClick={() => togglePackExpand(p)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={14} className="text-[#6B7280]" /> : <ChevronRight size={14} className="text-[#6B7280]" />}
                        <div className={`w-2 h-2 rounded-full ${p.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">
                            {p.theme || 'General'}
                            <span className="text-xs text-[#6B7280] ml-2">{p.difficulty}</span>
                          </p>
                          <p className="text-[10px] text-[#6B7280]">
                            {p.question_ids?.length || 0} Q · {p.puzzle_id ? '🧩' : '—'} · {p.lesson_id ? '📖' : '—'}
                            {' · '}
                            {new Date(p.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Publish toggle */}
                        <span
                          onClick={(e) => { e.stopPropagation(); togglePackStatus(p) }}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium cursor-pointer transition-colors ${
                            p.status === 'active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          title={p.status === 'active' ? 'Click to unpublish' : 'Click to publish'}
                        >
                          {p.status === 'active' ? <Eye size={12} /> : <EyeOff size={12} />}
                          {p.status}
                        </span>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 py-3 border-t border-gray-200 bg-white">
                        {loadingPackDetail === p.id ? (
                          <div className="flex items-center gap-2 py-4 justify-center">
                            <Loader2 size={14} className="animate-spin text-[#6B7280]" />
                            <span className="text-sm text-[#6B7280]">Loading pack contents...</span>
                          </div>
                        ) : detail ? (
                          <div className="space-y-3">
                            {/* Questions */}
                            <div>
                              <p className="text-xs font-semibold uppercase text-[#6B7280] mb-1.5">Questions ({detail.questions.length})</p>
                              {detail.questions.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No questions</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {detail.questions.map((q, qi) => (
                                    <div
                                      key={q.id}
                                      onClick={() => setEditQuestion(q)}
                                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                    >
                                      <span className="text-xs font-bold text-[#6B7280] w-5">{qi + 1}.</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-[#1A1A1A] truncate">{q.question_en}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          <span className="text-[10px]">🇬🇧{q.question_fr ? ' 🇫🇷' : ''}{q.question_it ? ' 🇮🇹' : ''}{q.question_es ? ' 🇪🇸' : ''}</span>
                                          <span className={`text-[10px] font-medium capitalize ${
                                            q.difficulty === 'hard' ? 'text-red-500' : q.difficulty === 'medium' ? 'text-amber-500' : 'text-green-500'
                                          }`}>{q.difficulty}</span>
                                        </div>
                                      </div>
                                      <Pencil size={12} className="text-[#6B7280]" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Puzzle */}
                            <div>
                              <p className="text-xs font-semibold uppercase text-[#6B7280] mb-1.5">🧩 Puzzle</p>
                              {detail.puzzle ? (
                                <div
                                  onClick={() => setEditingPuzzle({ ...detail.puzzle })}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-colors"
                                >
                                  <Puzzle size={14} className="text-purple-500" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[#1A1A1A] truncate">
                                      {detail.puzzle.title || detail.puzzle.title_en || detail.puzzle.interaction_type || 'Untitled'}
                                    </p>
                                    <p className="text-[10px] text-[#6B7280]">
                                      Type: {detail.puzzle.interaction_type} · {detail.puzzle.puzzle_type}
                                    </p>
                                  </div>
                                  <Pencil size={12} className="text-purple-400" />
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No puzzle</p>
                              )}
                            </div>

                            {/* Lesson */}
                            <div>
                              <p className="text-xs font-semibold uppercase text-[#6B7280] mb-1.5">📖 Lesson</p>
                              {detail.lesson ? (
                                <div
                                  onClick={() => setEditingLesson({ ...detail.lesson })}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors"
                                >
                                  <BookOpen size={14} className="text-blue-500" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[#1A1A1A] truncate">
                                      {detail.lesson.title || detail.lesson.title_en || 'Untitled Lesson'}
                                    </p>
                                    <p className="text-[10px] text-[#6B7280]">
                                      {detail.lesson.theme || '—'}
                                    </p>
                                  </div>
                                  <Pencil size={12} className="text-blue-400" />
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">No lesson</p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

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
            onClick={() => handleGenerate(0)}
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

          {/* Clear results */}
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
          {/* Streaming progress with animated messages */}
          {generating && (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl animate-bounce">{currentStep.icon}</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#1B3D2F] mb-0.5">{stepLabel}</p>
                  <p className="text-sm font-medium text-[#1A1A1A] transition-all">
                    {currentStep.text}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {progress.done}/{progress.total} questions ready · {formatElapsed(elapsed)}
                  </p>
                </div>
                <Loader2 size={16} className="text-[#2ECC71] animate-spin" />
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#2ECC71] to-[#27AE60] h-2.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress.total ? Math.max(5, (progress.done / progress.total) * 100) : 5}%` }}
                />
              </div>
            </Card>
          )}

          {/* Error + resume/keep buttons */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <p className="text-sm text-red-700 whitespace-pre-wrap mb-3">{error}</p>
              {resumeInfo && (
                <div className="flex gap-2">
                  <button
                    onClick={handleResume}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1B3D2F] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Play size={14} />
                    ▶️ Resume ({resumeInfo.resumeFrom}/{resumeInfo.totalRequested})
                  </button>
                  <button
                    onClick={keepPartial}
                    className="flex items-center gap-1.5 px-4 py-2 border border-[#D1D5DB] text-[#1A1A1A] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Check size={14} />
                    ✓ Keep {resumeInfo.resumeFrom} questions
                  </button>
                </div>
              )}
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
              <div className="px-4 py-3 border-b border-[#D1D5DB] bg-gray-50/50 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Generated Questions ({generated.length})
                </p>
                <div className="flex items-center gap-2">
                  {generated.some(q => q.status === 'pending_review') && (
                    <button
                      onClick={() => approveBatch(generated)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                      title="Approve all questions in this batch"
                    >
                      <CheckCircle size={12} />
                      Approve All
                    </button>
                  )}
                </div>
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
                        {/* Language flags */}
                        <span className="text-xs">
                          🇬🇧
                          {q.question_fr && ' 🇫🇷'}
                          {q.question_it && ' 🇮🇹'}
                          {q.question_es && ' 🇪🇸'}
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

          {/* Previous batch history */}
          {batchHistory.map((batch, batchIndex) => (
            <Card key={batch.id} className="p-0 overflow-hidden opacity-75">
              <div className="px-4 py-2.5 border-b border-[#D1D5DB] bg-gray-50/80 flex items-center justify-between">
                <p className="text-xs font-semibold text-[#6B7280]">
                  Batch {batchHistory.length - batchIndex} — {batch.questions.length} questions — {batch.duration} — {batch.cost}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">
                    {new Date(batch.timestamp).toLocaleTimeString()}
                  </span>
                  {batch.questions.some(q => q.status === 'pending_review') && (
                    <button
                      onClick={() => approveBatch(batch.questions)}
                      className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                      title="Approve all questions in this batch"
                    >
                      <CheckCircle size={10} />
                      Approve All
                    </button>
                  )}
                  <button
                    onClick={() => setBatchHistory(prev => prev.filter((_, idx) => idx !== batchIndex))}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Remove batch from view (questions stay in database)"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {batch.questions.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => setEditQuestion(q)}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-[#1A1A1A] truncate">
                        {q.question_en?.slice(0, 80)}{q.question_en?.length > 80 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#6B7280]">{q.macro_category}</span>
                        <span className={`text-xs font-medium capitalize ${
                          q.difficulty === 'hard' ? 'text-red-600' : q.difficulty === 'medium' ? 'text-amber-600' : 'text-green-600'
                        }`}>{q.difficulty}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          q.status === 'approved' ? 'bg-green-100 text-green-700'
                            : q.status === 'rejected' ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>{q.status?.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
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
          ))}

          {/* Empty state */}
          {!generating && generated.length === 0 && batchHistory.length === 0 && !error && (
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

      {/* QuestionModal for editing */}
      {editQuestion && (
        <QuestionModal
          question={editQuestion}
          onClose={() => setEditQuestion(null)}
          onSaved={handleQuestionSaved}
        />
      )}

      {/* AI Settings Panel */}
      {showSettings && (
        <AISettingsPanel
          onClose={() => setShowSettings(false)}
          currentPrompt={customPrompt}
          onPromptChanged={(newPrompt) => setCustomPrompt(newPrompt)}
        />
      )}

      {/* Puzzle Edit Modal */}
      {editingPuzzle && (
        <PuzzleEditModal
          puzzle={editingPuzzle}
          onClose={() => setEditingPuzzle(null)}
          onSave={handleSavePuzzle}
        />
      )}

      {/* Lesson Edit Modal */}
      {editingLesson && (
        <LessonEditModal
          lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSave={handleSaveLesson}
        />
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   PuzzleEditModal — edit puzzle metadata + context_data
   ════════════════════════════════════════════════════════════ */
function PuzzleEditModal({ puzzle, onClose, onSave }) {
  const [form, setForm] = useState({ ...puzzle })
  const [tab, setTab] = useState('en')
  const [jsonMode, setJsonMode] = useState(false)
  const [jsonText, setJsonText] = useState(JSON.stringify(puzzle.context_data || {}, null, 2))
  const [saving, setSaving] = useState(false)

  const LANGS = [
    { code: 'en', flag: '🇬🇧' },
    { code: 'fr', flag: '🇫🇷' },
    { code: 'it', flag: '🇮🇹' },
    { code: 'es', flag: '🇪🇸' },
  ]

  function updateField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function updateContextData(key, val) {
    setForm(prev => ({
      ...prev,
      context_data: { ...(prev.context_data || {}), [key]: val },
    }))
  }

  async function handleSave() {
    setSaving(true)
    let finalForm = { ...form }
    if (jsonMode) {
      try {
        finalForm.context_data = JSON.parse(jsonText)
      } catch {
        setSaving(false)
        return
      }
    }
    await onSave(finalForm)
    setSaving(false)
  }

  // Get context_data keys for the current language
  const cd = form.context_data || {}
  const langKeys = Object.keys(cd).filter(k => k.endsWith(`_${tab}`))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Puzzle size={18} className="text-purple-500" />
            <h3 className="font-bold text-[#1A1A1A]">Edit Puzzle</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-[#6B7280]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Metadata row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1">Interaction Type</label>
              <input value={form.interaction_type || ''} onChange={e => updateField('interaction_type', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1">Puzzle Type</label>
              <input value={form.puzzle_type || ''} onChange={e => updateField('puzzle_type', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1">Answer (index)</label>
              <input value={form.answer || ''} onChange={e => updateField('answer', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1">Theme</label>
              <input value={form.theme || ''} onChange={e => updateField('theme', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Direct columns per language */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase text-[#6B7280]">Direct Fields</p>
            </div>
            {/* Lang tabs */}
            <div className="flex gap-1 mb-3">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => setTab(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    tab === l.code ? 'bg-[#1B3D2F] text-white' : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                  }`}>
                  {l.flag} {l.code.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {['title', 'hint', 'explanation'].map(field => (
                <div key={field}>
                  <label className="block text-xs text-[#6B7280] mb-0.5 capitalize">{field}_{tab}</label>
                  <input
                    value={form[`${field}_${tab}`] || ''}
                    onChange={e => updateField(`${field}_${tab}`, e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* context_data — visual or JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase text-[#6B7280]">context_data</p>
              <button onClick={() => {
                if (!jsonMode) setJsonText(JSON.stringify(form.context_data || {}, null, 2))
                setJsonMode(!jsonMode)
              }} className="text-xs text-purple-600 hover:underline">
                {jsonMode ? 'Visual Mode' : 'JSON Mode'}
              </button>
            </div>
            {jsonMode ? (
              <textarea
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-xs font-mono h-48 resize-y"
              />
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {langKeys.length > 0 ? langKeys.map(key => (
                  <div key={key}>
                    <label className="block text-xs text-[#6B7280] mb-0.5">{key}</label>
                    {Array.isArray(cd[key]) ? (
                      <textarea
                        value={JSON.stringify(cd[key], null, 2)}
                        onChange={e => {
                          try { updateContextData(key, JSON.parse(e.target.value)) } catch {}
                        }}
                        className="w-full border rounded-lg px-3 py-2 text-xs font-mono h-20 resize-y"
                      />
                    ) : (
                      <input
                        value={cd[key] || ''}
                        onChange={e => updateContextData(key, e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                )) : (
                  <p className="text-xs text-gray-400 italic">No keys for {tab}. Switch to JSON mode to edit all.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B7280] hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Puzzle
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   LessonEditModal — edit lesson content in 4 languages
   ════════════════════════════════════════════════════════════ */
function LessonEditModal({ lesson, onClose, onSave }) {
  const [form, setForm] = useState({ ...lesson })
  const [tab, setTab] = useState('en')
  const [saving, setSaving] = useState(false)

  const LANGS = [
    { code: 'en', flag: '🇬🇧' },
    { code: 'fr', flag: '🇫🇷' },
    { code: 'it', flag: '🇮🇹' },
    { code: 'es', flag: '🇪🇸' },
  ]

  function updateField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-blue-500" />
            <h3 className="font-bold text-[#1A1A1A]">Edit Lesson</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-[#6B7280]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1">Theme</label>
              <input value={form.theme || ''} onChange={e => updateField('theme', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1">Difficulty</label>
              <select value={form.difficulty || 'medium'} onChange={e => updateField('difficulty', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Lang tabs */}
          <div className="flex gap-1">
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setTab(l.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === l.code ? 'bg-[#1B3D2F] text-white' : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'
                }`}>
                {l.flag} {l.code.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Title per lang */}
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">Title ({tab})</label>
            <input
              value={form[`title_${tab}`] || ''}
              onChange={e => updateField(`title_${tab}`, e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Content per lang */}
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">Content ({tab})</label>
            <textarea
              value={form[`content_${tab}`] || ''}
              onChange={e => updateField(`content_${tab}`, e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm h-32 resize-y"
            />
          </div>

          {/* Key Takeaway per lang */}
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1">Key Takeaway ({tab})</label>
            <input
              value={form[`key_takeaway_${tab}`] || ''}
              onChange={e => updateField(`key_takeaway_${tab}`, e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B7280] hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Lesson
          </button>
        </div>
      </div>
    </div>
  )
}
