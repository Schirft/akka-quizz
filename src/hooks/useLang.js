import { useState, useCallback } from 'react'
import { t, tp } from '../config/i18n'

/**
 * useLang — reactive hook for language state.
 * Reads from localStorage('akka_lang'), defaults to 'en'.
 * When setLang is called, both state and localStorage are updated,
 * triggering an immediate re-render of the component.
 */
export function useLang() {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('akka_lang') || 'en'
  )

  const setLang = useCallback((code) => {
    localStorage.setItem('akka_lang', code)
    setLangState(code)
  }, [])

  const translate = useCallback((key) => t(key, lang), [lang])
  const translateParams = useCallback((key, params) => tp(key, lang, params), [lang])

  return { lang, setLang, t: translate, tp: translateParams }
}
