import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useLang } from '../../hooks/useLang'
import { getLevelForXP } from '../../config/levels'
import {
  XP_QUIZ_STARTED,
  XP_CORRECT_ANSWER,
  XP_PERFECT_QUIZ,
  QUESTIONS_PER_QUIZ,
} from '../../config/constants'
import Button from '../../components/ui/Button'
import LevelUpModal from '../../components/LevelUpModal'
import { getScoreMessage, getQuizText } from '../../utils/quizI18n'
import { Home, Share2, Flame, Trophy, Zap, Target } from 'lucide-react'
import { playQuizComplete, playPerfect } from '../../lib/sounds'

/**
 * QuizResultsPage — shows quiz results with score circle, XP breakdown,
 * streak update, confetti for perfect score, and level-up modal.
 */
export default function QuizResultsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshProfile } = useAuth()
  const { profile, level } = useProfile()
  const { t, tp } = useLang()

  const [showConfetti, setShowConfetti] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [oldLevel, setOldLevel] = useState(null)

  // Extract results from navigation state
  const results = location.state
  if (!results) {
    navigate('/', { replace: true })
    return null
  }

  const { score, totalQuestions, answers, totalXP, avgTime, maxCombo = 0 } = results
  const isPerfect = score === QUESTIONS_PER_QUIZ
  const percentage = Math.round((score / totalQuestions) * 100)
  const percentile = Math.min(99, Math.round((score / 5) * 80 + Math.random() * 15))

  // Play sounds + confetti + check level up
  useEffect(() => {
    let mounted = true

    setTimeout(() => {
      if (!mounted) return
      if (isPerfect) {
        playPerfect()
      } else {
        playQuizComplete()
      }
    }, 400)

    if (score >= 4) {
      setShowConfetti(true)
      setTimeout(() => { if (mounted) setShowConfetti(false) }, 3000)
    }

    // Check level up after a delay
    setTimeout(() => { if (mounted) checkLevelUp() }, 1200)

    return () => { mounted = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Check if player leveled up
  async function checkLevelUp() {
    if (!profile) return

    const previousXP = (profile.total_xp || 0) - totalXP
    const previousLevel = getLevelForXP(Math.max(0, previousXP))
    const currentLevel = getLevelForXP(profile.total_xp || 0)

    // Refresh profile to get latest data
    await refreshProfile()

    if (currentLevel.level > previousLevel.level) {
      setOldLevel(previousLevel)
      setTimeout(() => setShowLevelUp(true), 1200)
    }
  }

  // XP breakdown computation
  const comboBonus = maxCombo >= 3 ? 15 : maxCombo >= 2 ? 5 : 0
  const streakBonus = profile?.current_streak >= 3 ? 10 : 0
  const dailyBonus = 10
  const correctXP = score * 10
  const computedTotalXP = correctXP + comboBonus + streakBonus + dailyBonus

  const xpLines = [
    { icon: '🎯', label: getQuizText('xpCorrectAnswers', lang), detail: `${score} × 10`, value: correctXP },
    { icon: '🔥', label: getQuizText('xpComboBonus', lang), detail: `max ${maxCombo}x`, value: comboBonus },
    { icon: '⚡', label: getQuizText('xpStreakBonus', lang), detail: '', value: streakBonus },
    { icon: '⭐', label: getQuizText('xpDailyBonus', lang), detail: '', value: dailyBonus },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3D2F] via-[#1B3D2F] to-[#0B1A14]">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#2ECC71', '#F1C40F', '#E74C3C', '#3498DB', '#9B59B6', '#1B3D2F'][i % 6],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Level Up Modal */}
      {showLevelUp && oldLevel && (
        <LevelUpModal
          oldLevel={oldLevel}
          newLevel={level}
          onClose={() => setShowLevelUp(false)}
        />
      )}

      <div className="max-w-[480px] mx-auto px-4 pt-8 pb-6">
        {/* Score Message */}
        <h2 className={`text-3xl font-black text-center mb-2 ${score === 5 ? 'animate-gradient-text' : 'text-white'}`}>
          {getScoreMessage(score, lang)}
        </h2>

        {/* Animated Score */}
        <motion.div
          className="text-6xl font-black text-[#2ECC71] text-center my-6"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
        >
          {score}/{totalQuestions}
        </motion.div>

        {/* Star border wrapper if perfect */}
        <div className={score === 5 ? 'animate-star-border' : ''}>
          <div className="bg-[#0B1A14] rounded-3xl p-6">
            {/* XP Breakdown staggered */}
            <div className="space-y-0">
              {xpLines.map((line, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-white/5 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${0.8 + i * 0.3}s`, animationFillMode: 'forwards' }}
                >
                  <span className="text-gray-300 text-sm">
                    {line.icon} {line.label} {line.detail && <span className="text-gray-500">({line.detail})</span>}
                  </span>
                  <span className="text-[#2ECC71] font-bold">{line.value > 0 ? `+${line.value}` : '0'} XP</span>
                </div>
              ))}
              {/* Total */}
              <motion.div
                className="flex justify-between items-center py-3 mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 }}
              >
                <span className="text-white font-bold">{getQuizText('xpTotal', lang)}</span>
                <motion.span
                  className="text-[#2ECC71] font-black text-xl"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 2.5 }}
                >
                  +{computedTotalXP} XP
                </motion.span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Percentile */}
        <p className="text-center text-gray-300 mt-6 opacity-0 animate-fade-in" style={{ animationDelay: '2.8s', animationFillMode: 'forwards' }}>
          {getQuizText('betterThan', lang)} <span className="text-[#2ECC71] font-bold text-xl">{percentile}%</span> {getQuizText('ofMembers', lang)}
        </p>

        {/* Come back tomorrow */}
        <p className="text-center text-gray-400 mt-4 opacity-0 animate-fade-in" style={{ animationDelay: '3.2s', animationFillMode: 'forwards' }}>
          {getQuizText('comeBackTomorrow', lang)}
        </p>

        {/* Action buttons */}
        <div className="space-y-3 mt-8">
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-4 rounded-2xl bg-[#2ECC71] text-white font-bold text-lg hover:bg-[#27AE60] transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} />
            {t('back_home')}
          </button>

          <button
            className="w-full py-3 rounded-2xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            onClick={() => {
              const shareKey = score === totalQuestions ? 'share_perfect' : 'share_normal'
              const shareText = tp(shareKey, { score, total: totalQuestions })

              if (navigator.share) {
                navigator.share({ title: 'Akka Quiz', text: shareText })
              } else {
                navigator.clipboard?.writeText(shareText)
              }
            }}
          >
            <Share2 size={18} />
            {t('share_results')}
          </button>
        </div>
      </div>
    </div>
  )
}
