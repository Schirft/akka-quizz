import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { LANGUAGES } from '../../config/constants'
import { useLang } from '../../hooks/useLang'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

/**
 * LoginPage — clean, centered, mobile-first login screen.
 * No display_name field — the DB trigger uses the email prefix automatically.
 */
export default function LoginPage() {
  const { signIn, signUp, signInDemo } = useAuth()
  const { lang, setLang, t } = useLang()

  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function validate() {
    if (!email.trim()) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email'
    if (password.length < 6) return 'Password must be at least 6 characters'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

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
        const result = await signUp(email, password)
        if (result?.needsConfirmation) {
          setMessage('Account created! Check your email to confirm, then sign in.')
          setMode('signin')
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleDemo() {
    setError('')
    setMessage('')
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
            {t('test_investor_knowledge')}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('signin'); setError(''); setMessage('') }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-akka-text shadow-sm'
                : 'text-akka-text-secondary'
            }`}
          >
            {t('sign_in')}
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); setMessage('') }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-akka-text shadow-sm'
                : 'text-akka-text-secondary'
            }`}
          >
            {t('sign_up')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-akka-text-secondary uppercase tracking-wide mb-1.5">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border border-akka-border bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-akka-green/30 focus:border-akka-green transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-akka-text-secondary uppercase tracking-wide mb-1.5">
              {t('password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-akka-border bg-white text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-akka-green/30 focus:border-akka-green transition-all"
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

          {/* Success message */}
          {message && (
            <p className="text-sm text-akka-green bg-emerald-50 px-3 py-2 rounded-lg">
              {message}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-akka-dark text-white font-semibold py-3.5 rounded-xl min-h-[52px] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? t('loading')
              : mode === 'signin'
              ? t('sign_in')
              : t('create_account')}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-akka-border" />
          <span className="text-xs text-akka-text-secondary">{t('or')}</span>
          <div className="flex-1 h-px bg-akka-border" />
        </div>

        {/* Demo button */}
        <button
          onClick={handleDemo}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border-2 border-akka-border text-akka-text font-semibold py-3.5 rounded-xl min-h-[52px] transition-all active:scale-[0.98] hover:border-akka-dark disabled:opacity-50"
        >
          {t('try_demo')}
          <ArrowRight size={16} />
        </button>

        {/* Language picker */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {LANGUAGES.map(({ code, flag }) => (
            <button
              key={code}
              onClick={() => setLang(code)}
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
