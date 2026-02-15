import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { LANGUAGES } from '../../config/constants'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

/**
 * LoginPage — clean, centered, mobile-first login screen.
 * Features: Sign In / Sign Up tabs, demo login, language picker.
 */
export default function LoginPage() {
  const { signIn, signUp, signInDemo } = useAuth()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState(
    () => localStorage.getItem('akka_lang') || 'en'
  )

  // Save language preference
  function handleLangChange(code) {
    setLang(code)
    localStorage.setItem('akka_lang', code)
  }

  // Validate form fields
  function validate() {
    if (!email.trim()) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email'
    if (password.length < 6) return 'Password must be at least 6 characters'
    if (mode === 'signup' && !displayName.trim()) return 'Display name is required'
    return null
  }

  // Handle form submit
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password, displayName)
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Handle demo login
  async function handleDemo() {
    setError('')
    setLoading(true)
    try {
      await signInDemo()
    } catch (err) {
      setError(err.message || 'Demo login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-akka-bg">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-akka-dark tracking-tight">
            akka<span className="text-akka-green">.quiz</span>
          </h1>
          <p className="text-sm text-akka-text-secondary mt-1">
            Test your investor knowledge
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('signin'); setError('') }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-akka-text shadow-sm'
                : 'text-akka-text-secondary'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError('') }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-akka-text shadow-sm'
                : 'text-akka-text-secondary'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display name — only on signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-akka-text-secondary uppercase tracking-wide mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-xl border border-akka-border bg-white text-akka-text placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-akka-green/30 focus:border-akka-green transition-all"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-akka-text-secondary uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-akka-border bg-white text-akka-text placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-akka-green/30 focus:border-akka-green transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-akka-text-secondary uppercase tracking-wide mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-akka-border bg-white text-akka-text placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-akka-green/30 focus:border-akka-green transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-akka-red bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-akka-dark text-white font-semibold py-3.5 rounded-xl min-h-[52px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Loading...'
              : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-akka-border" />
          <span className="text-xs text-akka-text-secondary">or</span>
          <div className="flex-1 h-px bg-akka-border" />
        </div>

        {/* Demo button */}
        <button
          onClick={handleDemo}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border-2 border-akka-border text-akka-text font-semibold py-3.5 rounded-xl min-h-[52px] transition-all active:scale-[0.98] hover:border-akka-dark disabled:opacity-50"
        >
          Try Demo
          <ArrowRight size={16} />
        </button>

        {/* Language picker */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {LANGUAGES.map(({ code, flag }) => (
            <button
              key={code}
              onClick={() => handleLangChange(code)}
              className={`text-lg px-2 py-1 rounded-lg transition-all ${
                lang === code
                  ? 'bg-gray-100 scale-110'
                  : 'opacity-50 hover:opacity-80'
              }`}
              title={code.toUpperCase()}
            >
              {flag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
