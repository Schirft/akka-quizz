import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLang } from '../../hooks/useLang'
import { TrendingUp, Briefcase, Clock, BarChart3, Swords } from 'lucide-react'

/**
 * ChallengePage — hub for the 2 challenge games (Valuation + Portfolio Builder).
 * Displayed inside PlayerLayout with TabBar.
 */
export default function ChallengePage() {
  const { t } = useLang()
  const navigate = useNavigate()

  const games = [
    {
      key: 'valuation',
      title: t('valuation_game'),
      description: t('estimate_valuation'),
      icon: TrendingUp,
      difficulty: t('medium'),
      duration: t('five_rounds'),
      gradient: 'from-[#2ECC71] to-[#1B8A4E]',
      iconBg: 'bg-[#2ECC71]/20',
      iconColor: 'text-white',
      path: '/challenge/valuation',
    },
    {
      key: 'portfolio',
      title: t('portfolio_game'),
      description: t('build_portfolio'),
      icon: Briefcase,
      difficulty: t('hard'),
      duration: t('eight_deals'),
      gradient: 'from-[#1B3D2F] to-[#0F2318]',
      iconBg: 'bg-white/15',
      iconColor: 'text-white',
      path: '/challenge/portfolio',
    },
  ]

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="w-11 h-11 rounded-xl bg-[#1B3D2F] flex items-center justify-center">
          <Swords className="w-5 h-5 text-[#2ECC71]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1B3D2F]">{t('challenge_1v1')}</h1>
          <p className="text-sm text-gray-500">{t('challenge_subtitle')}</p>
        </div>
      </motion.div>

      {/* Game cards */}
      <div className="space-y-4">
        {games.map((game, i) => {
          const Icon = game.icon
          return (
            <motion.button
              key={game.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(game.path)}
              className="w-full text-left"
            >
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${game.gradient} p-5 shadow-lg`}>
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute -bottom-4 -right-10 w-20 h-20 rounded-full bg-white/5" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl ${game.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${game.iconColor}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                        {game.difficulty}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-1">{game.title}</h2>
                  <p className="text-sm text-white/70 mb-4">{game.description}</p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{game.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/60">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{game.difficulty}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
