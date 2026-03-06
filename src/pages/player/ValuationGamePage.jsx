import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../hooks/useLang'
import { valuationDeals, opponents } from '../../data/challengeData'
import Confetti from '../../components/Confetti'
import Button from '../../components/ui/Button'
import { ArrowLeft, TrendingUp, Trophy, RotateCcw, Share2, Clock } from 'lucide-react'

const TIMER_SECONDS = 15
const TOTAL_ROUNDS = valuationDeals.length

/**
 * ValuationGamePage — 1v1 valuation estimation game.
 * Flow: Choose opponent → 5 rounds → Results
 */
export default function ValuationGamePage() {
  const { t, tp } = useLang()
  const navigate = useNavigate()

  // Game state
  const [phase, setPhase] = useState('choose') // choose | playing | reveal | results
  const [opponent, setOpponent] = useState(null)
  const [round, setRound] = useState(0)
  const [myScore, setMyScore] = useState(0)
  const [oppScore, setOppScore] = useState(0)
  const [myAnswer, setMyAnswer] = useState(null)
  const [oppAnswer, setOppAnswer] = useState(null)
  const [timer, setTimer] = useState(TIMER_SECONDS)
  const [showReveal, setShowReveal] = useState(false)
  const [roundResults, setRoundResults] = useState([])

  const deal = valuationDeals[round]

  // ─── Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || showReveal || myAnswer !== null) return
    if (timer <= 0) {
      handleAnswer(-1) // time's up → wrong answer
      return
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [phase, timer, showReveal, myAnswer])

  // ─── Choose opponent ────────────────────────────────────────────
  const selectOpponent = (opp) => {
    setOpponent(opp)
    setPhase('playing')
  }

  // ─── Handle answer ──────────────────────────────────────────────
  const handleAnswer = useCallback((choiceIndex) => {
    if (myAnswer !== null) return
    setMyAnswer(choiceIndex)

    // Opponent "thinks" for 1-3 sec then answers
    const oppDelay = 1000 + Math.random() * 2000
    setTimeout(() => {
      // Opponent picks a semi-random answer (biased toward correct)
      const correctIdx = deal.correctIndex
      const roll = Math.random()
      let oppIdx
      if (roll < 0.4) oppIdx = correctIdx
      else if (roll < 0.7) oppIdx = Math.max(0, correctIdx - 1)
      else oppIdx = Math.min(3, correctIdx + 1)
      setOppAnswer(oppIdx)

      // After opponent answers, show reveal
      setTimeout(() => {
        setShowReveal(true)

        // Calculate scores
        const myDist = choiceIndex === -1 ? 999 : Math.abs(choiceIndex - correctIdx)
        const oppDist = Math.abs(oppIdx - correctIdx)
        let myPts = 0
        let oPts = 0
        if (myDist < oppDist) myPts = 100
        else if (oppDist < myDist) oPts = 100
        else { myPts = 50; oPts = 50 }

        setMyScore((s) => s + myPts)
        setOppScore((s) => s + oPts)
        setRoundResults((prev) => [...prev, { myChoice: choiceIndex, oppChoice: oppIdx, myPts, oppPts: oPts }])
      }, 800)
    }, oppDelay)
  }, [myAnswer, deal, round])

  // ─── Next round ─────────────────────────────────────────────────
  const nextRound = () => {
    if (round + 1 >= TOTAL_ROUNDS) {
      setPhase('results')
      return
    }
    setRound((r) => r + 1)
    setMyAnswer(null)
    setOppAnswer(null)
    setShowReveal(false)
    setTimer(TIMER_SECONDS)
  }

  // ─── Reset ──────────────────────────────────────────────────────
  const resetGame = () => {
    setPhase('choose')
    setOpponent(null)
    setRound(0)
    setMyScore(0)
    setOppScore(0)
    setMyAnswer(null)
    setOppAnswer(null)
    setShowReveal(false)
    setTimer(TIMER_SECONDS)
    setRoundResults([])
  }

  const won = myScore > oppScore
  const isDraw = myScore === oppScore

  // ═══════════════════════════════════════════════════════════════
  //  RENDER: Choose Opponent
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'choose') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-4">
        <button onClick={() => navigate('/challenge')} className="flex items-center gap-2 text-gray-500 mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{t('back_to_challenge')}</span>
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#2ECC71]/10 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-7 h-7 text-[#2ECC71]" />
          </div>
          <h1 className="text-xl font-bold text-[#1B3D2F]">{t('valuation_game')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('choose_opponent')}</p>
        </div>

        <div className="space-y-3">
          {opponents.map((opp) => (
            <motion.button
              key={opp.name}
              whileTap={{ scale: 0.97 }}
              onClick={() => selectOpponent(opp)}
              className="w-full bg-white rounded-2xl border border-[#D1D5DB] shadow-sm p-4 flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: opp.color }}
              >
                {opp.avatar}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-[#1B3D2F]">{opp.name}</p>
                <p className="text-xs text-gray-500">{tp('level_n', { n: opp.level })} · {tp('pts', { n: opp.score })}</p>
              </div>
              <div className="text-[#2ECC71]">
                <Swords className="w-5 h-5" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  //  RENDER: Results
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-4 flex flex-col">
        {won && <Confetti />}

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center"
        >
          {/* Result icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
            won ? 'bg-[#2ECC71]/10' : isDraw ? 'bg-amber-50' : 'bg-red-50'
          }`}>
            <Trophy className={`w-10 h-10 ${
              won ? 'text-[#2ECC71]' : isDraw ? 'text-amber-500' : 'text-[#E74C3C]'
            }`} />
          </div>

          <h1 className={`text-3xl font-bold mb-2 ${
            won ? 'text-[#2ECC71]' : isDraw ? 'text-amber-500' : 'text-[#E74C3C]'
          }`}>
            {won ? t('victory') : isDraw ? t('draw') : t('defeat')}
          </h1>

          <p className="text-gray-500 text-sm mb-8">{t('final_score')}</p>

          {/* Score comparison */}
          <div className="w-full max-w-xs bg-white rounded-2xl border border-[#D1D5DB] shadow-sm p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <div className="w-10 h-10 rounded-full bg-[#1B3D2F] flex items-center justify-center mx-auto mb-1">
                  <span className="text-white text-xs font-bold">{t('you').charAt(0)}</span>
                </div>
                <p className="text-xs text-gray-500">{t('you')}</p>
                <p className="text-2xl font-bold text-[#1B3D2F]">{myScore}</p>
              </div>
              <div className="text-gray-300 text-xl font-light">vs</div>
              <div className="text-center flex-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1"
                  style={{ backgroundColor: opponent.color }}
                >
                  <span className="text-white text-xs font-bold">{opponent.avatar}</span>
                </div>
                <p className="text-xs text-gray-500">{opponent.name}</p>
                <p className="text-2xl font-bold text-[#1B3D2F]">{oppScore}</p>
              </div>
            </div>

            {/* Round-by-round */}
            <div className="border-t border-gray-100 pt-3 space-y-1.5">
              {roundResults.map((r, i) => (
                <div key={i} className="flex items-center text-xs">
                  <span className="text-gray-400 w-16">Round {i + 1}</span>
                  <div className="flex-1 flex items-center gap-1">
                    <span className={`font-semibold ${r.myPts > r.oppPts ? 'text-[#2ECC71]' : r.myPts < r.oppPts ? 'text-[#E74C3C]' : 'text-amber-500'}`}>
                      +{r.myPts}
                    </span>
                    <span className="text-gray-300">vs</span>
                    <span className={`font-semibold ${r.oppPts > r.myPts ? 'text-[#2ECC71]' : r.oppPts < r.myPts ? 'text-[#E74C3C]' : 'text-amber-500'}`}>
                      +{r.oppPts}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full space-y-3">
            <Button variant="secondary" className="w-full" onClick={resetGame}>
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('play_again')}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/challenge')}>
              {t('back_to_challenge')}
            </Button>
            <button className="w-full text-center text-sm text-[#3B82F6] font-medium py-2">
              <Share2 className="w-4 h-4 inline mr-1" />
              {t('share_linkedin')}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  //  RENDER: Playing (round)
  // ═══════════════════════════════════════════════════════════════
  const timerPercent = (timer / TIMER_SECONDS) * 100
  const timerColor = timer <= 3 ? '#E74C3C' : timer <= 5 ? '#F59E0B' : '#2ECC71'

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Top bar: scores + round */}
      <div className="bg-[#1B3D2F] text-white px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => { if (window.confirm('Quit?')) navigate('/challenge') }}>
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <span className="text-xs font-medium text-white/60">
            {tp('round_of', { n: round + 1, total: TOTAL_ROUNDS })}
          </span>
          <div className="w-5" />
        </div>

        {/* Score bars */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">{t('you')}</span>
              <span className="text-xs font-bold">{myScore}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#2ECC71] rounded-full"
                animate={{ width: `${Math.max(5, (myScore / (TOTAL_ROUNDS * 100)) * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-white/40">vs</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold">{opponent?.name}</span>
              <span className="text-xs font-bold">{oppScore}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: opponent?.color }}
                animate={{ width: `${Math.max(5, (oppScore / (TOTAL_ROUNDS * 100)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col">
        {/* Timer */}
        {!showReveal && (
          <div className="flex justify-center mb-4">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke={timerColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - timerPercent / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${timer <= 3 ? 'text-[#E74C3C] animate-timer-pulse' : 'text-[#1B3D2F]'}`}>
                  {timer}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Deal card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={round}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="bg-white rounded-2xl border border-[#D1D5DB] shadow-sm p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#1B3D2F]/5 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#1B3D2F]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1B3D2F]">{deal.name}</h3>
                <p className="text-xs text-gray-500">{deal.sector}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t('arr'), value: deal.arr },
                { label: t('growth'), value: deal.growth },
                { label: t('margin'), value: deal.margin },
                { label: t('team'), value: deal.teamSize },
                { label: t('founded'), value: deal.founded },
                { label: t('sector'), value: deal.sector },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F8F9FA] rounded-lg px-3 py-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-[#1B3D2F]">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Answer choices or reveal */}
        {!showReveal ? (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-gray-400 text-center mb-1">{t('your_answer')}</p>
            {deal.choices.map((choice, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.97 }}
                disabled={myAnswer !== null}
                onClick={() => handleAnswer(i)}
                className={`w-full rounded-xl border-2 px-4 py-3 font-semibold text-sm transition-all
                  ${myAnswer === i
                    ? 'border-[#2ECC71] bg-[#2ECC71]/10 text-[#1B3D2F]'
                    : myAnswer !== null
                      ? 'border-gray-100 bg-gray-50 text-gray-400'
                      : 'border-[#D1D5DB] bg-white text-[#1B3D2F] hover:border-[#2ECC71]'
                  }`}
              >
                {choice}
              </motion.button>
            ))}

            {myAnswer !== null && oppAnswer === null && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-gray-400 mt-2"
              >
                {t('opponent_thinking')}
                <span className="inline-block animate-pulse ml-1">...</span>
              </motion.p>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 mb-4"
          >
            {/* Real valuation reveal */}
            <div className="bg-gradient-to-r from-[#2ECC71] to-[#1B8A4E] rounded-xl p-4 text-center">
              <p className="text-xs text-white/70 mb-1">{t('real_valuation')}</p>
              <p className="text-2xl font-bold text-white">{deal.realValuation}</p>
            </div>

            {/* Comparison */}
            <div className="flex gap-3">
              <div className={`flex-1 rounded-xl p-3 text-center border-2 ${
                roundResults[round]?.myPts > roundResults[round]?.oppPts
                  ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                  : roundResults[round]?.myPts < roundResults[round]?.oppPts
                    ? 'border-[#E74C3C] bg-red-50'
                    : 'border-amber-300 bg-amber-50'
              }`}>
                <p className="text-[10px] text-gray-400 uppercase">{t('you')}</p>
                <p className="text-sm font-bold text-[#1B3D2F]">
                  {myAnswer === -1 ? '—' : deal.choices[myAnswer]}
                </p>
                {roundResults[round]?.myPts > roundResults[round]?.oppPts && (
                  <span className="text-[10px] text-[#2ECC71] font-semibold">{t('closer')}</span>
                )}
              </div>
              <div className={`flex-1 rounded-xl p-3 text-center border-2 ${
                roundResults[round]?.oppPts > roundResults[round]?.myPts
                  ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                  : roundResults[round]?.oppPts < roundResults[round]?.myPts
                    ? 'border-[#E74C3C] bg-red-50'
                    : 'border-amber-300 bg-amber-50'
              }`}>
                <p className="text-[10px] text-gray-400 uppercase">{opponent?.name}</p>
                <p className="text-sm font-bold text-[#1B3D2F]">
                  {deal.choices[oppAnswer]}
                </p>
                {roundResults[round]?.oppPts > roundResults[round]?.myPts && (
                  <span className="text-[10px] text-[#2ECC71] font-semibold">{t('closer')}</span>
                )}
              </div>
            </div>

            <Button variant="secondary" className="w-full" onClick={nextRound}>
              {round + 1 >= TOTAL_ROUNDS ? t('see_results') : t('next_question')}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Inline icon used in choose phase
function Swords({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" y1="14" x2="9" y2="18" />
      <line x1="7" y1="17" x2="4" y2="20" />
      <line x1="3" y1="19" x2="5" y2="21" />
    </svg>
  )
}
