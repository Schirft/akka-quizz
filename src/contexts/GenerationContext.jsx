import { createContext, useContext, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const GenerationContext = createContext(null)

const SUPABASE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

const ALL_THEMES = [
  'fundraising', 'cap_tables', 'term_sheets', 'unit_economics',
  'revenue_growth', 'burn_analysis', 'market_comps', 'startup_valuation',
  'due_diligence', 'exit_strategies',
]
const ALL_DIFFICULTIES = ['easy', 'medium', 'hard']

/**
 * GenerationProvider — persists pack generation state across admin page navigation.
 * When the user starts generating packs, the edge-function calls continue even if
 * they navigate to another admin tab. A banner in AdminLayout shows live progress.
 */
export function GenerationProvider({ children }) {
  // Pack generation params (persisted across tab changes)
  const [packTheme, setPackTheme] = useState('fundraising')
  const [packDifficulty, setPackDifficulty] = useState('medium')
  const [packCount, setPackCount] = useState(1)

  // Pack generation progress
  const [packGenerating, setPackGenerating] = useState(false)
  const [packStep, setPackStep] = useState(0)
  const [packBatchProgress, setPackBatchProgress] = useState({ current: 0, total: 0, step: 0, errors: [] })
  const [packBatchResults, setPackBatchResults] = useState([])
  const [packResult, setPackResult] = useState(null)
  const [packError, setPackError] = useState(null)
  const [retryingTranslation, setRetryingTranslation] = useState(false)
  const packAbortRef = useRef(false)

  // Classic question generation indicator (for nav dot)
  const [classicGenerating, setClassicGenerating] = useState(false)

  // ── Edge function caller ──
  async function callEdgeFunction(fnName, body) {
    const res = await fetch(`${SUPABASE_FN_URL}/${fnName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || `HTTP ${res.status}`)
    }
    return res.json()
  }

  // ── Generate one pack (5-step sequential edge function calls) ──
  async function generateOnePack(theme, difficulty) {
    // Step 1: Questions
    setPackStep(0)
    const qResult = await callEdgeFunction('generate-pack-questions', { theme, difficulty })
    const questionIds = qResult.question_ids || []
    if (packAbortRef.current) return null

    // Step 2: Puzzle
    setPackStep(1)
    const pResult = await callEdgeFunction('generate-pack-puzzle', { theme, difficulty })
    const puzzleId = pResult.puzzle_id
    const puzzleData = pResult.puzzle_data || {}
    if (packAbortRef.current) return null

    // Step 3: Lesson
    setPackStep(2)
    const lResult = await callEdgeFunction('generate-pack-lesson', {
      theme,
      puzzle_id: puzzleId,
      puzzle_title: puzzleData.title || 'Puzzle',
      puzzle_answer: JSON.stringify(puzzleData.answer || ''),
      puzzle_explanation: puzzleData.explanation || '',
      puzzle_visual_type: puzzleData?.context_data?.visual_type || '',
    })
    const lessonId = lResult.lesson_id
    if (packAbortRef.current) return null

    // Step 4: Translate
    setPackStep(3)
    let tResult = { translated: {}, stats: { duration_s: 0, estimated_cost_usd: 0 } }
    let translationNote = null
    try {
      tResult = await callEdgeFunction('translate-pack', {
        question_ids: questionIds,
        puzzle_id: puzzleId,
        lesson_id: lessonId,
      })
    } catch (tErr) {
      console.error('[Pack] Translation failed:', tErr.message)
      translationNote = `Translation failed: ${tErr.message}. Pack created in English only.`
    }
    if (packAbortRef.current) return null

    // Step 5: Assemble pack record
    setPackStep(4)
    const todayDate = new Date().toISOString().slice(0, 10)
    const { data: packRow, error: packErr } = await supabase
      .from('daily_packs')
      .insert({
        theme,
        difficulty,
        question_ids: questionIds,
        puzzle_id: puzzleId,
        lesson_id: lessonId,
        status: 'active',
        assigned_date: todayDate,
      })
      .select('id')
      .single()

    if (packErr) console.error('[Pack] daily_packs insert error:', packErr)

    const totalStats = {
      duration_s: (qResult.stats?.duration_s || 0) + (pResult.stats?.duration_s || 0) +
        (lResult.stats?.duration_s || 0) + (tResult.stats?.duration_s || 0),
      api_calls: 4,
      estimated_cost_usd: +((qResult.stats?.estimated_cost_usd || 0) + (pResult.stats?.estimated_cost_usd || 0) +
        (lResult.stats?.estimated_cost_usd || 0) + (tResult.stats?.estimated_cost_usd || 0)).toFixed(3),
    }

    return {
      questions: questionIds.length,
      puzzle: puzzleId ? 1 : 0,
      lesson: lessonId ? 1 : 0,
      packId: packRow?.id || null,
      stats: totalStats,
      translated: tResult.translated || {},
      translationNote,
    }
  }

  // ── Batch pack generation (1-100 packs) ──
  const handleGeneratePack = useCallback(async (onComplete) => {
    setPackGenerating(true)
    setPackStep(0)
    setPackResult(null)
    setPackError(null)
    setPackBatchResults([])
    setPackBatchProgress({ current: 0, total: packCount, step: 0, errors: [] })
    packAbortRef.current = false

    const startTime = Date.now()
    const results = []

    try {
      for (let i = 0; i < packCount; i++) {
        if (packAbortRef.current) break
        setPackBatchProgress(prev => ({ ...prev, current: i + 1, step: 0 }))

        try {
          const effectiveTheme = packTheme === 'random' ? ALL_THEMES[i % ALL_THEMES.length] : packTheme
          const effectiveDifficulty = packDifficulty === 'random' ? ALL_DIFFICULTIES[i % ALL_DIFFICULTIES.length] : packDifficulty
          const result = await generateOnePack(effectiveTheme, effectiveDifficulty)
          if (result) {
            results.push(result)
            setPackBatchResults(prev => [...prev, result])
          }
        } catch (err) {
          console.error(`[Pack ${i + 1}] Error:`, err)
          setPackBatchProgress(prev => ({
            ...prev,
            errors: [...prev.errors, { index: i + 1, message: err.message }],
          }))
          continue
        }
      }

      const totalDuration = Math.round((Date.now() - startTime) / 1000)
      const totalCost = results.reduce((sum, r) => sum + (r.stats?.estimated_cost_usd || 0), 0)
      const totalApiCalls = results.reduce((sum, r) => sum + (r.stats?.api_calls || 0), 0)

      if (results.length > 0) {
        setPackResult({
          questions: results.reduce((s, r) => s + (r.questions || 0), 0),
          puzzle: results.reduce((s, r) => s + (r.puzzle || 0), 0),
          lesson: results.reduce((s, r) => s + (r.lesson || 0), 0),
          packCount: results.length,
          packIds: results.map(r => r.packId).filter(Boolean),
          stats: {
            duration_s: totalDuration,
            api_calls: totalApiCalls,
            estimated_cost_usd: +totalCost.toFixed(3),
          },
        })
      } else if (!packAbortRef.current) {
        setPackError('All pack generations failed')
      }
    } catch (err) {
      setPackError(err.message)
    }

    setPackGenerating(false)
    // Notify caller (e.g., GeneratePage to refresh packs list)
    if (onComplete) onComplete(results)
  }, [packTheme, packDifficulty, packCount])

  // ── Abort ──
  function abortPackGeneration() {
    packAbortRef.current = true
  }

  // ── Retry translations ──
  async function retryTranslations(packId) {
    if (!packId) return
    setRetryingTranslation(true)
    try {
      const { data, error } = await supabase.functions.invoke('translate-pack', { body: { pack_id: packId } })
      if (error) throw error
      console.log('Translation retry result:', data)
      setPackResult(prev => prev ? { ...prev, translationRetried: true } : prev)
    } catch (err) {
      console.error('Translation retry error:', err)
      setPackError(`Translation retry failed: ${err.message}`)
    }
    setRetryingTranslation(false)
  }

  // ── Expose nav-level generating indicator (pack OR classic) ──
  const isGenerating = packGenerating || classicGenerating

  const value = {
    // Pack generation params
    packTheme, setPackTheme,
    packDifficulty, setPackDifficulty,
    packCount, setPackCount,
    // Pack generation state
    packGenerating,
    packStep,
    packBatchProgress, setPackBatchProgress,
    packBatchResults, setPackBatchResults,
    packResult, setPackResult,
    packError, setPackError,
    retryingTranslation,
    // Pack generation actions
    handleGeneratePack,
    abortPackGeneration,
    retryTranslations,
    // Classic generation indicator
    classicGenerating, setClassicGenerating,
    // Combined indicator
    isGenerating,
  }

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  )
}

export function useGeneration() {
  const ctx = useContext(GenerationContext)
  if (!ctx) throw new Error('useGeneration must be used inside <GenerationProvider>')
  return ctx
}
