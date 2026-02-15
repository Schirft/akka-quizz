import { useEffect, useState } from 'react'
import Button from './ui/Button'
import { Trophy, ArrowUp, Sparkles } from 'lucide-react'
import { playLevelUp } from '../lib/sounds'

/**
 * LevelUpModal — celebration overlay when player levels up.
 * Shows old → new level, benefit unlocked, and close button.
 */
export default function LevelUpModal({ oldLevel, newLevel, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true))
    // Play level up sound
    playLevelUp()
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-all duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-3xl p-6 w-full max-w-sm text-center transition-all duration-500 ${
          visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'
        }`}
      >
        {/* Trophy icon */}
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Trophy size={40} className="text-amber-500" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-akka-text mb-1">Level Up!</h2>
        <p className="text-akka-text-secondary text-sm mb-6">
          Congratulations on reaching a new level!
        </p>

        {/* Level transition */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {/* Old level */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-1">
              <span className="text-xl font-bold text-akka-text-secondary">
                {oldLevel?.level}
              </span>
            </div>
            <span className="text-xs text-akka-text-secondary">{oldLevel?.name}</span>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center">
            <ArrowUp size={24} className="text-akka-green" />
          </div>

          {/* New level */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-akka-green flex items-center justify-center mb-1">
              <span className="text-xl font-bold text-akka-green">{newLevel?.level}</span>
            </div>
            <span className="text-xs font-semibold text-akka-green">{newLevel?.name}</span>
          </div>
        </div>

        {/* Benefit unlocked */}
        {newLevel?.benefit && (
          <div className="bg-emerald-50 rounded-xl p-3 mb-6 flex items-center gap-2">
            <Sparkles size={16} className="text-akka-green shrink-0" />
            <p className="text-sm text-akka-text">
              <span className="font-semibold">Unlocked:</span> {newLevel.benefit}
            </p>
          </div>
        )}

        {/* Close button */}
        <Button variant="primary" className="w-full" onClick={handleClose}>
          Continue
        </Button>
      </div>
    </div>
  )
}
