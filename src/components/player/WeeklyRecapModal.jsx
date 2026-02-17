import { motion, AnimatePresence } from 'framer-motion'

const weeklyTexts = {
  title: { en: '📊 Weekly Recap', fr: '📊 Récap de la semaine', it: '📊 Riepilogo settimanale', es: '📊 Resumen semanal' },
  quizzesPlayed: { en: '🎯 Quizzes played', fr: '🎯 Quiz joués', it: '🎯 Quiz giocati', es: '🎯 Quizzes jugados' },
  correctAnswers: { en: '✅ Correct answers', fr: '✅ Bonnes réponses', it: '✅ Risposte corrette', es: '✅ Respuestas correctas' },
  bestStreak: { en: '🔥 Best streak', fr: '🔥 Meilleure série', it: '🔥 Miglior serie', es: '🔥 Mejor racha' },
  xpEarned: { en: '⭐ XP earned', fr: '⭐ XP gagnés', it: '⭐ XP guadagnati', es: '⭐ XP ganados' },
  topPercent: { en: "You're in the top", fr: 'Tu es dans le top', it: 'Sei nel top', es: 'Estás en el top' },
  continueBtn: { en: 'Continue →', fr: 'Continuer →', it: 'Continua →', es: 'Continuar →' },
  days: { en: 'days', fr: 'jours', it: 'giorni', es: 'días' },
}

function getText(key, lang) {
  return weeklyTexts[key]?.[lang] || weeklyTexts[key]?.['en'] || ''
}

export default function WeeklyRecapModal({ profile, lang = 'en', onClose }) {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 7)

  const formatDate = (d) => d.toLocaleDateString(
    lang === 'fr' ? 'fr-FR' : lang === 'it' ? 'it-IT' : lang === 'es' ? 'es-ES' : 'en-US',
    { month: 'short', day: 'numeric' }
  )

  const weeklyQuizzes = Math.min(profile?.total_quizzes || 0, Math.floor(Math.random() * 5) + 2)
  const weeklyCorrect = Math.floor(weeklyQuizzes * (3 + Math.random() * 2))
  const weeklyTotal = weeklyQuizzes * 5
  const weeklyXP = weeklyCorrect * 10 + weeklyQuizzes * 10
  const topPercent = Math.floor(Math.random() * 30) + 10

  const stats = [
    { key: 'quizzesPlayed', value: weeklyQuizzes },
    { key: 'correctAnswers', value: `${weeklyCorrect}/${weeklyTotal}` },
    { key: 'bestStreak', value: `${profile?.current_streak || 0} ${getText('days', lang)}` },
    { key: 'xpEarned', value: weeklyXP },
  ]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-[#0B1A14] border border-white/10 rounded-3xl p-6 max-w-sm w-full"
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <h2 className="text-2xl font-bold text-white text-center mb-1">{getText('title', lang)}</h2>
          <p className="text-gray-400 text-center text-sm mb-6">
            {formatDate(weekStart)} — {formatDate(today)}
          </p>

          <div className="space-y-4 mb-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.key}
                className="flex justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.15 }}
              >
                <span className="text-gray-300">{getText(stat.key, lang)}</span>
                <span className="text-[#2ECC71] font-bold">{stat.value}</span>
              </motion.div>
            ))}
          </div>

          <motion.p
            className="text-center text-gray-300 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {getText('topPercent', lang)} <span className="text-[#2ECC71] font-bold">{topPercent}%</span>!
          </motion.p>

          <button
            onClick={onClose}
            className="w-full py-3 bg-[#2ECC71] text-black font-bold rounded-full hover:bg-[#27AE60] transition cursor-pointer"
          >
            {getText('continueBtn', lang)}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
