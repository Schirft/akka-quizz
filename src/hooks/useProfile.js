import { useAuth } from './useAuth'
import { getLevelForXP, getLevelProgress } from '../config/levels'

/**
 * useProfile — returns the user profile with computed level info.
 */
export function useProfile() {
  const { profile, loading } = useAuth()

  if (!profile) {
    return { profile: null, level: null, levelProgress: 0, loading }
  }

  const level = getLevelForXP(profile.total_xp || 0)
  const levelProgress = getLevelProgress(profile.total_xp || 0)

  return {
    profile,
    level,
    levelProgress,
    loading,
  }
}
