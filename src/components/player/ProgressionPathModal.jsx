import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { LEVELS } from '../../config/levels'
import { useLang } from '../../hooks/useLang'

const LEVEL_EMOJIS = {
  1: '', 2: '', 3: '', 4: '', 5: '',
  6: '', 7: '', 8: '', 9: '', 10: '',
}

const LEVEL_COLORS = {
  1: '#4ADE80', 2: '#34D399', 3: '#2DD4BF', 4: '#22D3EE', 5: '#60A5FA',
  6: '#818CF8', 7: '#A78BFA', 8: '#C084FC', 9: '#F472B6', 10: '#FBBF24',
}

/**
 * ProgressionPathModal — immersive game-like progression path.
 * Dark themed, vertical path with glowing nodes, emojis, connecting lines.
 * Auto-scrolls to the current level on open.
 */
export default function ProgressionPathModal({ open, onClose, currentLevel, totalXP }) {
  const { t } = useLang()
  const currentRef = useRef(null)

  // Auto-scroll to current level on open
  useEffect(() => {
    if (open && currentRef.current) {
      setTimeout(() => {
        currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)
    }
  }, [open])

  if (!open) return null

  // Display levels from highest (10) to lowest (1) — "climb" metaphor
  const reversedLevels = [...LEVELS].reverse()

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Full-screen dark overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <motion.div
          className="relative w-full max-w-[430px] h-[92vh] rounded-t-3xl overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dark gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#071A12] via-[#0E2A1F] to-[#071A12]" />

          {/* Subtle dot grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${2 + Math.random() * 3}px`,
                  height: `${2 + Math.random() * 3}px`,
                  background: `rgba(46, 204, 113, ${0.1 + Math.random() * 0.15})`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `pp-float ${4 + Math.random() * 5}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 4}s`,
                }}
              />
            ))}
          </div>

          {/* Header */}
          <div className="sticky top-0 z-20 px-5 py-4 flex items-center justify-between backdrop-blur-md bg-[#071A12]/80 border-b border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {t('progression_path') || 'Your Journey'}
              </h2>
              <p className="text-[11px] text-white/30 mt-0.5">
                {t('climb_ranks') || 'Climb the ranks — unlock rewards'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
            >
              <X size={16} className="text-white/60" />
            </button>
          </div>

          {/* Scrollable path */}
          <div className="relative overflow-y-auto h-[calc(92vh-76px)] px-5 py-6">
            {/* Vertical connecting line — the path backbone */}
            <div
              className="absolute left-[38px] top-6 bottom-6 w-[2px]"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), rgba(46,204,113,0.15), rgba(255,255,255,0.03))',
              }}
            />

            <div className="space-y-0">
              {reversedLevels.map((lvl, idx) => {
                const isUnlocked = totalXP >= lvl.xpRequired
                const isCurrent = currentLevel?.level === lvl.level
                const isNext = currentLevel && lvl.level === currentLevel.level + 1
                const emoji = LEVEL_EMOJIS[lvl.level]
                const color = LEVEL_COLORS[lvl.level]

                // Progress to next level (only for current)
                let progressToNext = 0
                if (isCurrent && lvl.level < 10) {
                  const nextLvl = LEVELS[lvl.level]
                  const needed = nextLvl.xpRequired - lvl.xpRequired
                  progressToNext = Math.min((totalXP - lvl.xpRequired) / needed, 1)
                }

                return (
                  <motion.div
                    key={lvl.level}
                    ref={isCurrent ? currentRef : null}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + idx * 0.04, duration: 0.35 }}
                    className="relative flex items-start gap-4 py-4"
                  >
                    {/* ─── NODE ─── */}
                    <div className="relative z-10 shrink-0">
                      {isCurrent ? (
                        /* ★ Current level — glowing animated node */
                        <div className="relative">
                          {/* Outer glow ring */}
                          <div
                            className="absolute -inset-3 rounded-full"
                            style={{
                              background: `radial-gradient(circle, ${color}35, transparent 70%)`,
                              animation: 'pp-glow 2.5s ease-in-out infinite',
                            }}
                          />
                          {/* Rotating ring */}
                          <div
                            className="absolute -inset-1 rounded-full"
                            style={{
                              background: `conic-gradient(from 0deg, transparent, ${color}40, transparent, ${color}20, transparent)`,
                              animation: 'pp-rotate 4s linear infinite',
                            }}
                          />
                          {/* Main node */}
                          <div
                            className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center border-2"
                            style={{
                              borderColor: color,
                              background: `linear-gradient(135deg, ${color}25, ${color}08)`,
                              boxShadow: `0 0 24px ${color}30, inset 0 0 12px ${color}10`,
                            }}
                          >
                            <span className="text-2xl">{emoji}</span>
                          </div>
                        </div>
                      ) : isUnlocked ? (
                        /* ✓ Completed level — subtle colored node */
                        <div
                          className="w-[52px] h-[52px] rounded-full flex items-center justify-center border"
                          style={{
                            borderColor: `${color}30`,
                            background: `linear-gradient(135deg, ${color}12, transparent)`,
                          }}
                        >
                          <span className="text-xl opacity-80">{emoji}</span>
                        </div>
                      ) : (
                        /* Locked level — gray/dark node */
                        <div className="w-[52px] h-[52px] rounded-full bg-white/[0.05] border border-white/[0.10] flex items-center justify-center">
                          <span className="text-white/30 text-xs font-bold"></span>
                        </div>
                      )}
                    </div>

                    {/* ─── LEVEL INFO ─── */}
                    <div className="flex-1 min-w-0 pt-1">
                      {/* Level tag + status badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isUnlocked || isCurrent ? 'text-white/25' : 'text-white/35'}`}>
                          LVL {lvl.level}
                        </span>
                        {isCurrent && (
                          <span
                            className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide"
                            style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                          >
                            ★ You are here
                          </span>
                        )}
                        {isUnlocked && !isCurrent && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-emerald-400/80 bg-emerald-500/10">
                            ✓ Completed
                          </span>
                        )}
                        {isNext && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-amber-400/80 bg-amber-500/10 border border-amber-500/20">
                            Next →
                          </span>
                        )}
                      </div>

                      {/* Level name */}
                      <p
                        className={`text-[15px] font-bold mt-1 ${
                          isCurrent ? 'text-white' : isUnlocked ? 'text-white/70' : 'text-white/50'
                        }`}
                      >
                        {lvl.name}
                      </p>

                      {/* Benefit / reward */}
                      <p
                        className={`text-[11px] mt-0.5 leading-snug ${
                          isCurrent ? 'text-white/50' : isUnlocked ? 'text-white/30' : 'text-white/30'
                        }`}
                      >
                        {lvl.benefit}
                      </p>

                      {/* XP requirement */}
                      <p className="text-[10px] text-white/25 mt-1 tabular-nums">
                        {lvl.xpRequired.toLocaleString()} XP {isUnlocked ? '' : 'required'}
                      </p>

                      {/* Progress bar for current level */}
                      {isCurrent && lvl.level < 10 && (
                        <div className="mt-3 max-w-[240px]">
                          <div className="h-[6px] w-full rounded-full bg-white/[0.07] overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${progressToNext * 100}%` }}
                              transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
                              style={{
                                background: `linear-gradient(90deg, ${color}, ${color}90)`,
                                boxShadow: `0 0 8px ${color}40`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="text-[10px] text-white/35 tabular-nums">
                              {totalXP.toLocaleString()} XP
                            </p>
                            <p className="text-[10px] font-medium tabular-nums" style={{ color: `${color}90` }}>
                              {LEVELS[lvl.level].xpRequired.toLocaleString()} XP
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right arrow for current */}
                    {isCurrent && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                          style={{ background: `${color}15`, color: `${color}80` }}
                        >
                          &rsaquo;
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}

              {/* Bottom CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center pt-6 pb-4"
              >
                <p className="text-[11px] text-white/20">
                  Keep playing daily to level up!
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes pp-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.1; }
          50% { transform: translateY(-12px) scale(1.3); opacity: 0.3; }
        }
        @keyframes pp-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes pp-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  )
}
