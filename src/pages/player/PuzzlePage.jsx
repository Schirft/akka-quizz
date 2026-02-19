import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../../hooks/useLang'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react'

/**
 * PuzzlePage — renders a puzzle based on its type.
 * Receives puzzleId from location.state or query.
 * Supports 6 puzzle types: tap_to_spot, ab_choice, fill_gap, match_chart, before_after, crash_point
 */

export default function PuzzlePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { lang } = useLang()

  const puzzleId = location.state?.puzzleId
  const fromChallenge = location.state?.onDone === 'challenge'

  const [puzzle, setPuzzle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(null)

  useEffect(() => {
    if (!puzzleId) {
      setLoading(false)
      return
    }
    loadPuzzle()
  }, [puzzleId])

  async function loadPuzzle() {
    const { data } = await supabase
      .from('puzzles')
      .select('*')
      .eq('id', puzzleId)
      .single()
    setPuzzle(data)
    setLoading(false)
  }

  function getLang(key) {
    if (!puzzle?.context_data) return ''
    return puzzle.context_data[`${key}_${lang}`] || puzzle.context_data[`${key}_en`] || ''
  }

  function getList(key) {
    if (!puzzle?.context_data) return []
    return puzzle.context_data[`${key}_${lang}`] || puzzle.context_data[`${key}_en`] || []
  }

  function handleSelect(idx, correctIdx) {
    if (answered) return
    setSelectedIdx(idx)
    setAnswered(true)
    setCorrect(idx === correctIdx)

    // Record attempt
    if (user && puzzleId) {
      supabase.from('puzzle_attempts').insert({
        user_id: user.id,
        puzzle_id: puzzleId,
        is_correct: idx === correctIdx,
        response_time_ms: 0,
      }).then(() => {})
    }
  }

  function handleDone() {
    if (fromChallenge) {
      navigate('/challenge')
    } else {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 size={24} className="text-[#1B3D2F] animate-spin" />
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <p className="text-4xl mb-4">🧩</p>
        <h2 className="text-lg font-bold mb-2">Puzzle Not Found</h2>
        <button onClick={() => navigate('/')} className="text-sm text-[#1B3D2F] underline mt-4">
          Go Home
        </button>
      </div>
    )
  }

  const c = puzzle.context_data || {}
  const type = puzzle.interaction_type

  // ── Common wrapper ──
  function PuzzleWrapper({ children }) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={20} className="text-[#6B7280]" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wider text-purple-600 font-bold">The Catch</p>
            <p className="text-[10px] text-[#6B7280]">{puzzle.theme}</p>
          </div>
        </div>
        <div className="flex-1 px-4 py-4">{children}</div>
        {answered && (
          <div className="px-4 py-4">
            <div className={`p-3 rounded-xl mb-3 ${correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                {correct ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                <p className={`text-sm font-bold ${correct ? 'text-green-800' : 'text-red-800'}`}>
                  {correct ? 'Correct!' : 'Not quite!'}
                </p>
              </div>
              <p className="text-xs text-gray-700">
                {getLang('explanation') || puzzle?.[`explanation_${lang}`] || puzzle?.explanation || ''}
              </p>
            </div>
            <button
              onClick={handleDone}
              className="w-full py-3.5 bg-[#1B3D2F] text-white font-bold rounded-xl text-sm"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── RENDER BY TYPE ──

  // 1. Tap to Spot
  if (type === 'tap_to_spot') {
    return (
      <PuzzleWrapper>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Spot the Error</h2>
        <p className="text-sm text-[#6B7280] mb-4">Tap the part that's wrong:</p>
        <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-800 leading-relaxed mb-4">
          {getLang('statement')}
        </div>
        {!answered ? (
          <button
            onClick={() => handleSelect(0, 0)}
            className="w-full py-3 border-2 border-purple-300 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-50"
          >
            I found the error!
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600 font-medium">Error: {getLang('error_part')}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 font-medium">Correct: {getLang('correction')}</p>
            </div>
          </div>
        )}
      </PuzzleWrapper>
    )
  }

  // 2. A/B Choice
  if (type === 'ab_choice') {
    const correctOpt = parseInt(puzzle.answer, 10) || 0
    return (
      <PuzzleWrapper>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">A/B Choice</h2>
        <p className="text-sm text-gray-700 mb-4 leading-relaxed">{getLang('scenario')}</p>
        <div className="space-y-3">
          {['option_a', 'option_b'].map((key, idx) => {
            let style = 'border-gray-200 bg-white'
            if (answered) {
              if (idx === correctOpt) style = 'border-green-500 bg-green-50'
              else if (idx === selectedIdx) style = 'border-red-500 bg-red-50'
              else style = 'border-gray-100 bg-gray-50'
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx, correctOpt)}
                disabled={answered}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium ${style}`}
              >
                <span className="font-bold mr-2">{idx === 0 ? 'A' : 'B'}.</span>
                {getLang(key)}
              </button>
            )
          })}
        </div>
      </PuzzleWrapper>
    )
  }

  // 3. Fill the Gap
  if (type === 'fill_gap') {
    const correctIdx = parseInt(puzzle.answer, 10) || 0
    const options = getList('options')
    return (
      <PuzzleWrapper>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Fill the Gap</h2>
        <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-800 leading-relaxed mb-4">
          {getLang('statement')}
        </div>
        <div className="space-y-2">
          {options.map((opt, idx) => {
            let style = 'border-gray-200 bg-white'
            if (answered) {
              if (idx === correctIdx) style = 'border-green-500 bg-green-50'
              else if (idx === selectedIdx) style = 'border-red-500 bg-red-50'
              else style = 'border-gray-100 bg-gray-50'
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx, correctIdx)}
                disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium ${style}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </PuzzleWrapper>
    )
  }

  // 4. Match Chart
  if (type === 'match_chart') {
    const correctIdx = parseInt(puzzle.answer, 10) || 0
    const options = getList('options')
    return (
      <PuzzleWrapper>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Match the Chart</h2>
        <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-800 mb-4">
          📈 {getLang('chart_description')}
        </div>
        <p className="text-sm text-[#6B7280] mb-3">What does this chart represent?</p>
        <div className="space-y-2">
          {options.map((opt, idx) => {
            let style = 'border-gray-200 bg-white'
            if (answered) {
              if (idx === correctIdx) style = 'border-green-500 bg-green-50'
              else if (idx === selectedIdx) style = 'border-red-500 bg-red-50'
              else style = 'border-gray-100 bg-gray-50'
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx, correctIdx)}
                disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium ${style}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </PuzzleWrapper>
    )
  }

  // 5. Before & After
  if (type === 'before_after') {
    const correctIdx = parseInt(puzzle.answer, 10) || 0
    const options = getList('options')
    return (
      <PuzzleWrapper>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Before & After</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-[10px] uppercase text-[#6B7280] font-bold mb-1">Before</p>
            <p className="text-sm text-gray-800">{getLang('before')}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl">
            <p className="text-[10px] uppercase text-amber-600 font-bold mb-1">After</p>
            <p className="text-sm text-gray-800">{getLang('after')}</p>
          </div>
        </div>
        <p className="text-sm font-medium text-[#1A1A1A] mb-3">{getLang('question')}</p>
        <div className="space-y-2">
          {options.map((opt, idx) => {
            let style = 'border-gray-200 bg-white'
            if (answered) {
              if (idx === correctIdx) style = 'border-green-500 bg-green-50'
              else if (idx === selectedIdx) style = 'border-red-500 bg-red-50'
              else style = 'border-gray-100 bg-gray-50'
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx, correctIdx)}
                disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium ${style}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </PuzzleWrapper>
    )
  }

  // 6. Crash Point
  if (type === 'crash_point') {
    const correctIdx = parseInt(puzzle.answer, 10) || 0
    const options = getList('options')
    return (
      <PuzzleWrapper>
        <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">Crash Point</h2>
        <div className="p-4 bg-red-50 rounded-xl text-sm text-red-800 mb-4">
          💥 {getLang('timeline')}
        </div>
        <p className="text-sm font-medium text-[#1A1A1A] mb-3">{getLang('question')}</p>
        <div className="space-y-2">
          {options.map((opt, idx) => {
            let style = 'border-gray-200 bg-white'
            if (answered) {
              if (idx === correctIdx) style = 'border-green-500 bg-green-50'
              else if (idx === selectedIdx) style = 'border-red-500 bg-red-50'
              else style = 'border-gray-100 bg-gray-50'
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx, correctIdx)}
                disabled={answered}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium ${style}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </PuzzleWrapper>
    )
  }

  // Fallback
  return (
    <PuzzleWrapper>
      <p className="text-sm text-[#6B7280]">Unknown puzzle type: {type}</p>
    </PuzzleWrapper>
  )
}
