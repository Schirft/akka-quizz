import { AnimatePresence, motion } from 'framer-motion'
import { X, Lock, CheckCircle } from 'lucide-react'
import { LEVELS } from '../../config/levels'
import { useLang } from '../../hooks/useLang'

/**
 * ProgressionPathModal — full-screen modal showing all 10 levels
 * with current progress, unlock status, and benefits.
 */
export default function ProgressionPathModal({ open, onClose, currentLevel, totalXP }) {
  const { t } = useLang()

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-[430px] max-h-[85vh] bg-white rounded-t-3xl overflow-y-auto"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Progression Path</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          {/* Levels list */}
          <div className="px-5 py-4 space-y-3">
            {LEVELS.map((lvl) => {
              const isUnlocked = totalXP >= lvl.xpRequired
              const isCurrent = currentLevel?.level === lvl.level

              return (
                <div
                  key={lvl.level}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-[#2ECC71] bg-[#2ECC71]/5'
                      : isUnlocked
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-100 bg-white opacity-50'
                  }`}
                >
                  {/* Level badge */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-[#1B3D2F] text-white'
                        : isUnlocked
                          ? 'bg-[#2ECC71]/10 text-[#2ECC71]'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isUnlocked ? (
                      <span className="text-sm font-bold">{lvl.level}</span>
                    ) : (
                      <Lock size={14} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${isCurrent ? 'text-[#1B3D2F]' : 'text-[#1A1A1A]'}`}>
                        {lvl.name}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] font-bold text-[#2ECC71] bg-[#2ECC71]/10 px-2 py-0.5 rounded-full">
                          {t('current_streak') ? 'CURRENT' : 'CURRENT'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{lvl.benefit}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {lvl.xpRequired.toLocaleString()} XP
                    </p>
                  </div>

                  {/* Status icon */}
                  {isUnlocked && (
                    <CheckCircle size={18} className="text-[#2ECC71] shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
