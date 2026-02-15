import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { getLevelForXP } from '../../config/levels'
import {
  XP_QUIZ_STARTED,
  XP_CORRECT_ANSWER,
  XP_PERFECT_QUIZ,
  QUESTIONS_PER_QUIZ,
} from '../../config/constants'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Confetti from '../../components/Confetti'
import LevelUpModal from '../../components/LevelUpModal'
import { Home, RotateCcw, Share2, Flame, Trophy, Zap, Target } from 'lucide-react'
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

  const [showConfetti, setShowConfetti] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [oldLevel, setOldLevel] = useState(null)
  const [animatedXP, setAnimatedXP] = useState([])
  const [totalAnimated, setTotalAnimated] = useState(0)

  // Extract results from navigation state
  const results = location.state
  if (!results) {
    // Redirect to home if no results (direct navigation)
    navigate('/', { replace: true })
    return null
  }

  const { score, totalQuestions, answers, totalXP, avgTime } = results
  const isPerfect = score === QUESTIONS_PER_QUIZ
  const percentage = Math.round((score / totalQuestions) * 100)

  // Contextual message
  const getMessage = () => {
    if (isPerfect) return { text: 'Perfect Score!', emoji: '🏆' }
    if (percentage >= 80) return { text: 'Excellent!', emoji: '🌟' }
    if (percentage >= 60) return { text: 'Good Job!', emoji: '👍' }
    if (percentage >= 40) return { text: 'Keep Learning!', emoji: '📚' }
    return { text: 'Better Luck Tomorrow!', emoji: '💪' }
  }

  const message = getMessage()

  // Build XP breakdown items
  const xpBreakdown = []
  xpBreakdown.push({ label: 'Quiz started', amount: XP_QUIZ_STARTED, icon: '🎯' })
  const correctCount = answers.filter((a) => a.correct).length
  if (correctCount > 0) {
    xpBreakdown.push({
      label: `${correctCount} correct answer${correctCount > 1 ? 's' : ''}`,
      amount: correctCount * XP_CORRECT_ANSWER,
      icon: '✅',
    })
  }
  const speedBonusTotal = answers.reduce(
    (sum, a) => sum + Math.max(0, a.xpEarned - XP_CORRECT_ANSWER),
    0
  )
  if (speedBonusTotal > 0) {
    xpBreakdown.push({ label: 'Speed bonus', amount: speedBonusTotal, icon: '⚡' })
  }
  if (isPerfect) {
    xpBreakdown.push({ label: 'Perfect quiz bonus', amount: XP_PERFECT_QUIZ, icon: '🏆' })
  }

  // Animate XP breakdown sequentially + check level up
  useEffect(() => {
    let mounted = true
    const items = []
    let running = 0

    const animateNext = (index) => {
      if (!mounted || index >= xpBreakdown.length) {
        // After all animations, check for level up & refresh profile
        checkLevelUp()
        return
      }

      setTimeout(() => {
        if (!mounted) return
        items.push(xpBreakdown[index])
        running += xpBreakdown[index].amount
        setAnimatedXP([...items])
        setTotalAnimated(running)
        animateNext(index + 1)
      }, 400)
    }

    // Start animations after a brief delay
    setTimeout(() => animateNext(0), 600)

    // Play quiz complete sound
    setTimeout(() => {
      if (!mounted) return
      if (isPerfect) {
        playPerfect()
      } else {
        playQuizComplete()
      }
    }, 400)

    // Show confetti for perfect score
    if (isPerfect) {
      setTimeout(() => {
        if (mounted) setShowConfetti(true)
      }, 300)
    }

    return () => {
      mounted = false
    }
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

  // Score circle color
  const scoreColor =
    percentage >= 80 ? 'text-akka-green' : percentage >= 40 ? 'text-amber-500' : 'text-akka-red'

  const scoreBg =
    percentage >= 80 ? 'bg-emerald-50' : percentage >= 40 ? 'bg-amber-50' : 'bg-red-50'

  // SVG circle calculations for score ring
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="min-h-screen bg-akka-bg">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Level Up Modal */}
      {showLevelUp && oldLevel && (
        <LevelUpModal
          oldLevel={oldLevel}
          newLevel={level}
          onClose={() => setShowLevelUp(false)}
        />
      )}

      <div className="max-w-[480px] mx-auto px-4 pt-8 pb-6">
        {/* Score circle */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-36 h-36 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`${scoreColor} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-akka-text">
                {score}/{totalQuestions}
              </span>
              <span className="text-xs text-akka-text-secondary">correct</span>
            </div>
          </div>

          {/* Message */}
          <div className="text-center">
            <span className="text-3xl mb-1 block">{message.emoji}</span>
            <h1 className="text-2xl font-bold text-akka-text">{message.text}</h1>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mb-4">
          <Card className="flex-1 flex flex-col items-center py-3">
            <Target size={18} className="text-akka-green mb-1" />
            <p className="text-lg font-bold text-akka-text">{percentage}%</p>
            <p className="text-[10px] text-akka-text-secondary">Accuracy</p>
          </Card>
          <Card className="flex-1 flex flex-col items-center py-3">
            <Zap size={18} className="text-amber-500 mb-1" />
            <p className="text-lg font-bold text-akka-text">{avgTime}s</p>
            <p className="text-[10px] text-akka-text-secondary">Avg. time</p>
          </Card>
          <Card className="flex-1 flex flex-col items-center py-3">
            <Flame size={18} className="text-orange-500 mb-1" />
            <p className="text-lg font-bold text-akka-text">{profile?.current_streak || 0}</p>
            <p className="text-[10px] text-akka-text-secondary">Streak</p>
          </Card>
        </div>

        {/* XP Breakdown */}
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-akka-green" />
            <p className="text-xs font-semibold uppercase tracking-wide text-akka-text-secondary">
              XP Earned
            </p>
          </div>

          <div className="space-y-2">
            {animatedXP.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between animate-fade-in"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm text-akka-text">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-akka-green">+{item.amount}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-3 pt-3 border-t border-akka-border flex items-center justify-between">
            <span className="text-sm font-bold text-akka-text">Total XP</span>
            <span className="text-lg font-bold text-akka-green">+{totalAnimated}</span>
          </div>
        </Card>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full gap-2"
            onClick={() => navigate('/', { replace: true })}
          >
            <Home size={18} />
            Back to Home
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              const shareText = score === totalQuestions
                ? `🏆 Score parfait ${score}/${totalQuestions} sur le Quiz Akka !\nViens tester tes connaissances en investissement startup et découvre Akka, le club d'investissement de référence en Europe.\n👉 akka.app`
                : `💡 J'ai scoré ${score}/${totalQuestions} au Quiz Akka sur l'investissement startup !\nPense-tu pouvoir faire mieux ? Teste tes connaissances et rejoins Akka.\n👉 akka.app`

              if (navigator.share) {
                navigator.share({ title: 'Akka Quiz', text: shareText })
              } else {
                // Fallback: copy to clipboard
                navigator.clipboard?.writeText(shareText)
              }
            }}
          >
            <Share2 size={18} />
            Share Results
          </Button>
        </div>
      </div>
    </div>
  )
}
