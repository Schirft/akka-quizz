import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

/**
 * useAuth — convenience hook to access auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
