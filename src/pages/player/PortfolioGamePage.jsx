import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../../hooks/useLang'
import { portfolioDeals } from '../../data/challengeData'
import Confetti from '../../components/Confetti'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import { ArrowLeft, Briefcase, Check, X, Trophy, RotateCcw, Share2, TrendingUp, TrendingDown } from 'lucide-react'

const TOTAL_BUDGET = 100 // in K€
const MIN_INVEST = 10   // 10K€ per deal
const FAKE_AVG_MULTIPLE = 2.4
const FAKE_RANK = '127 / 3,841'

/**
 * PortfolioGamePage — build a portfolio from 8 deals, then reveal outcomes.
 * Flow: Intro → Selection → Reveal (sequential) → Results
 */
export default function PortfolioGamePage() {
  const { t } = useLang()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('intro') // intro | select | reveal | results
  const [investments, setInvestments] = useState({}) // { dealIndex: amountK }
  const [revealIndex, setRevealIndex] = useState(-1)
  const [revealedDeals, setRevealedDeals] = useState([])

  const totalInvested = Object.values(investments).reduce((s, v) => s + v, 0)
  const remaining = TOTAL_BUDGET - totalInvested

  // ─── Invest / Remove ────────────────────────────────────────────
  const toggleInvest = (idx) => {
    setInvestments((prev) => {
      const copy = { ...prev }
      if (copy[idx]) {
        delete copy[idx]
      } else if (remaining >= MIN_INVEST) {
        copy[idx] = MIN_INVEST
      }
      return copy
    })
  }

  const adjustInvestment = (idx, delta) => {
    setInvestments((prev) => {
      const current = prev[idx] || 0
      const newVal = current + delta
      if (newVal < MIN_INVEST) return prev
      if (delta > 0 && remaining < delta) return prev
      return { ...prev, [idx]: newVal }
    })
  }

  // ─── Reveal animation ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'reveal') return
    if (revealIndex >= Object.keys(investments).length) {
      // All revealed
      setTimeout(() => setPhase('results'), 1500)
      return
    }
    const timer = setTimeout(() => {
      const investedIndices = Object.keys(investments).map(Number)
      const idx = investedIndices[revealIndex]
      setRevealedDeals((prev) => [...prev, idx])
      setRevealIndex((i) => i + 1)
    }, revealIndex === -1 ? 500 : 1200)
    return () => clearTimeout(timer)
  }, [phase, revealIndex, investments])

  const startReveal = () => {
    setPhase('reveal')
    setRevealIndex(0)
    setRevealedDeals([])
  }

  // ─── Calculations ──────────────────────────────────────────────
  const calcFinalValue = () => {
    let total = 0
    Object.entries(investments).forEach(([idx, amount]) => {
      const deal = portfolioDeals[idx]
      total += amount * deal.outcome
    })
    return total
  }

  const finalValue = calcFinalValue()
  const multiple = totalInvested > 0 ? (finalValue / totalInvested) : 0
  const won = multiple >= FAKE_AVG_MULTIPLE

  const resetGame = () => {
    setPhase('intro')
    setInvestments({})
    setRevealIndex(-1)
    setRevealedDeals([])
  }

  // ═══════════════════════════════════════════════════════════════
  //  RENDER: Intro
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-4 flex flex-col">
        <button onClick={() => navigate('/challenge')} className="flex items-center gap-2 text-gray-500 mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{t('back_to_challenge')}</span>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1B3D2F] to-[#0F2318] flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-[#2ECC71]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1B3D2F] mb-3">{t('portfolio_intro_title')}</h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto mb-8">
              {t('portfolio_intro_text')}
            </p>

            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="bg-[#2ECC71]/10 rounded-xl px-4 py-2">
                <p className="text-xs text-[#2ECC71] font-semibold">{t('virtual_budget')}</p>
              </div>
              <div className="bg-[#1B3D2F]/5 rounded-xl px-4 py-2">
                <p className="text-xs text-[#1B3D2F] font-semibold">{t('min_per_deal')}</p>
              </div>
            </div>

            <Button variant="primary" className="w-full max-w-xs" onClick={() => setPhase('select')}>
              {t('start_game')}
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  //  RENDER: Select deals
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'select') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
        {/* Budget bar */}
        <div className="bg-[#1B3D2F] text-white px-4 pt-4 pb-3 sticky top-0 z-30">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setPhase('intro')}>
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </button>
            <span className="text-sm font-semibold">{t('portfolio_game')}</span>
            <div className="w-5" />
          </div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-white/60">{t('remaining_budget')}</span>
            <span className="font-bold">{remaining}K\u20ac / {TOTAL_BUDGET}K\u20ac</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#2ECC71] rounded-full"
              animate={{ width: `${(remaining / TOTAL_BUDGET) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
          </div>
        </div>

        {/* Deal cards */}
        <div className="px-4 py-4 space-y-3 flex-1">
          {portfolioDeals.map((deal, idx) => {
            const invested = investments[idx] || 0
            const isInvested = invested > 0
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-2xl border-2 shadow-sm p-4 transition-colors ${
                  isInvested ? 'border-[#2ECC71]' : 'border-[#D1D5DB]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-[#1B3D2F]">{deal.name}</h3>
                    <p className="text-xs text-gray-500">{deal.sector}</p>
                  </div>
                  {isInvested && (
                    <div className="bg-[#2ECC71]/10 rounded-full p-1">
                      <Check className="w-4 h-4 text-[#2ECC71]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-600 mb-2">{deal.description}</p>

                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  <div className="bg-[#F8F9FA] rounded-lg px-2 py-1.5">
                    <p className="text-[9px] text-gray-400 uppercase">{t('round_amount')}</p>
                    <p className="text-xs font-semibold text-[#1B3D2F]">{deal.round.split(' \u2014 ')[1]}</p>
                  </div>
                  <div className="bg-[#F8F9FA] rounded-lg px-2 py-1.5">
                    <p className="text-[9px] text-gray-400 uppercase">{t('valuation')}</p>
                    <p className="text-xs font-semibold text-[#1B3D2F]">{deal.valuation}</p>
                  </div>
                  <div className="bg-[#F8F9FA] rounded-lg px-2 py-1.5">
                    <p className="text-[9px] text-gray-400 uppercase">{t('metrics')}</p>
                    <p className="text-xs font-semibold text-[#1B3D2F] truncate">{deal.metrics}</p>
                  </div>
                </div>

                {isInvested ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustInvestment(idx, -10)}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 active:scale-95"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-sm font-bold text-[#2ECC71]">{invested}K\u20ac</span>
                    </div>
                    <button
                      onClick={() => adjustInvestment(idx, 10)}
                      disabled={remaining < 10}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 active:scale-95"
                    >
                      +
                    </button>
                    <button
                      onClick={() => toggleInvest(idx)}
                      className="ml-1 text-xs text-[#E74C3C] font-medium"
                    >
                      {t('remove')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleInvest(idx)}
                    disabled={remaining < MIN_INVEST}
                    className="w-full rounded-xl border-2 border-dashed border-[#D1D5DB] py-2.5 text-sm font-medium text-gray-500 hover:border-[#2ECC71] hover:text-[#2ECC71] transition-colors disabled:opacity-30"
                  >
                    {t('invest')} · {MIN_INVEST}K\u20ac
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Validate button */}
        {Object.keys(investments).length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
            <Button variant="secondary" className="w-full" onClick={startReveal}>
              {t('validate_portfolio')} · {totalInvested}K\u20ac {t('invested').toLowerCase()}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  //  RENDER: Reveal (sequential)
  // ═══════════════════════════════════════════════════════════════
  if (phase === 'reveal') {
    const investedIndices = Object.keys(investments).map(Number)
    return (
      <div className="min-h-screen bg-[#1B3D2F] p-4 flex flex-col items-center justify-center">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-lg font-bold mb-8"
        >
          {t('revealing_results')}
        </motion.h2>

        <div className="w-full space-y-3">
          {investedIndices.map((idx, i) => {
            const deal = portfolioDeals[idx]
            const isRevealed = revealedDeals.includes(idx)
            const amount = investments[idx]
            const returnVal = amount * deal.outcome

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-xl p-4 transition-all duration-500 ${
                  isRevealed ? 'bg-white' : 'bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isRevealed
                        ? deal.outcome >= 1 ? 'bg-[#2ECC71]/10' : 'bg-red-50'
                        : 'bg-white/10'
                    }`}>
                      {isRevealed ? (
                        deal.outcome >= 1
                          ? <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
                          : <TrendingDown className="w-4 h-4 text-[#E74C3C]" />
                      ) : (
                        <span className="text-white/30 text-lg">?</span>
                      )}
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${isRevealed ? 'text-[#1B3D2F]' : 'text-white/60'}`}>
                        {deal.name}
                      </p>
                      <p className={`text-xs ${isRevealed ? 'text-gray-500' : 'text-white/30'}`}>
                        {amount}K\u20ac {t('invested').toLowerCase()}
                      </p>
                    </div>
                  </div>

                  {isRevealed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-right"
                    >
                      <p className={`text-lg font-bold ${deal.outcome >= 1 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                        {deal.outcome}x
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(returnVal)}K\u20ac
                      </p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  //  RENDER: Results
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 flex flex-col">
      {won && <Confetti />}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col items-center justify-center"
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
          won ? 'bg-[#2ECC71]/10' : 'bg-red-50'
        }`}>
          <Trophy className={`w-10 h-10 ${won ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`} />
        </div>

        <h1 className="text-xl font-bold text-[#1B3D2F] mb-1">{t('your_portfolio_value')}</h1>
        <p className={`text-4xl font-bold mb-1 ${won ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
          {Math.round(finalValue)}K\u20ac
        </p>
        <p className={`text-lg font-semibold mb-6 ${won ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
          {multiple.toFixed(1)}x {t('multiple').toLowerCase()}
        </p>

        {/* Stats card */}
        <div className="w-full max-w-xs bg-white rounded-2xl border border-[#D1D5DB] shadow-sm p-5 mb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('initial_investment')}</span>
              <span className="text-sm font-semibold text-[#1B3D2F]">{totalInvested}K\u20ac</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('final_value')}</span>
              <span className={`text-sm font-semibold ${won ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                {Math.round(finalValue)}K\u20ac
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('total_return')}</span>
              <span className={`text-sm font-bold ${won ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                {multiple >= 1 ? '+' : ''}{Math.round((multiple - 1) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="w-full max-w-xs bg-white rounded-2xl border border-[#D1D5DB] shadow-sm p-5 mb-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('average_players')}</span>
              <span className="text-sm font-semibold text-[#1B3D2F]">{FAKE_AVG_MULTIPLE}x</span>
            </div>
            <div>
              <ProgressBar value={multiple / 5} color={won ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'} />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">0x</span>
                <span className="text-[10px] text-gray-400">5x+</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('your_rank')}</span>
              <span className="text-sm font-semibold text-[#1B3D2F]">{FAKE_RANK}</span>
            </div>
          </div>
        </div>

        {/* Deal breakdown */}
        <div className="w-full max-w-xs mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t('your_results')}</p>
          <div className="space-y-1.5">
            {Object.entries(investments).map(([idx, amount]) => {
              const deal = portfolioDeals[idx]
              const ret = amount * deal.outcome
              return (
                <div key={idx} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <span className="text-gray-600">{deal.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{amount}K\u20ac</span>
                    <span className={`font-semibold ${deal.outcome >= 1 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                      {deal.outcome}x → {Math.round(ret)}K\u20ac
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
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
