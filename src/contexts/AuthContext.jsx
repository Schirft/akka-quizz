import { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DEMO_EMAIL, DEMO_PASSWORD } from '../config/constants'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return data || null
    } catch {
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    // Safety timeout — if loading takes more than 5s, force it to false
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn('[AuthContext] Safety timeout: forcing loading=false after 5s')
        setLoading(false)
      }
    }, 5000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const p = await fetchProfile(u.id)
        if (mounted) setProfile(p)
      }
      if (mounted) setLoading(false)
    }).catch((err) => {
      // Gracefully handle AbortError from Supabase internals
      if (err?.name === 'AbortError' || err?.message?.includes('abort')) {
        console.warn('[AuthContext] AbortError caught, forcing loading=false')
      }
      if (mounted) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          try {
            const p = await fetchProfile(u.id)
            if (mounted) setProfile(p)
          } catch {
            // Profile fetch failed silently — user is still authed
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user && !data.session) return { ...data, needsConfirmation: true }
    return data
  }

  async function signOut() {
    try { await supabase.auth.signOut() } catch {}
    setUser(null)
    setProfile(null)
  }

  async function signInDemo() {
    return signIn(DEMO_EMAIL, DEMO_PASSWORD)
  }

  async function refreshProfile() {
    if (user) {
      const p = await fetchProfile(user.id)
      setProfile(p)
      return p
    }
    return null
  }

  const value = { user, profile, loading, signIn, signUp, signOut, signInDemo, refreshProfile }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
