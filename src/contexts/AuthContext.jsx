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
      const result = await Promise.race([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000))
      ])
      return result.data || null
    } catch {
      return null
    }
  }

  // Effect 1 : Auth only — FAST, non-async
  useEffect(() => {
    let mounted = true
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] Auth event:', event)
        if (!mounted) return
        setUser(session?.user ?? null)
        if (!session?.user) setProfile(null)
        setLoading(false)
        clearTimeout(safetyTimer)
      }
    )

    return () => { mounted = false; clearTimeout(safetyTimer); subscription.unsubscribe() }
  }, [])

  // Effect 2 : Profile loading — background, non-blocking
  useEffect(() => {
    if (!user) return
    let mounted = true
    fetchProfile(user.id).then(p => {
      if (mounted) setProfile(p)
    })
    return () => { mounted = false }
  }, [user?.id])

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
