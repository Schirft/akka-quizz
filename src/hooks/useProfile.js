import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { getLevelForXP, getLevelProgress } from '../config/levels'

/**
 * useProfile — returns the user profile with computed level info.
 * If AuthContext has user but no profile (e.g. after refresh), fetches it directly.
 */
export function useProfile() {
  const { user, profile: authProfile, loading } = useAuth()
  const [localProfile, setLocalProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    // If AuthContext already has profile, use it
    if (authProfile) {
      setLocalProfile(authProfile)
      return
    }

    // If we have a user but no profile, fetch it ourselves
    if (user && !authProfile && !profileLoading) {
      setProfileLoading(true)
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setLocalProfile(data)
          setProfileLoading(false)
        })
        .catch(() => setProfileLoading(false))
    }
  }, [user, authProfile])

  const profile = authProfile || localProfile

  if (!profile) {
    return { profile: null, level: null, levelProgress: 0, loading: loading || profileLoading }
  }

  const level = getLevelForXP(profile.total_xp || 0)
  const levelProgress = getLevelProgress(profile.total_xp || 0)

  return {
    profile,
    level,
    levelProgress,
    loading: false,
  }
}
