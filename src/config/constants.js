/**
 * App-wide constants for quiz, gamification, and UI.
 */

// Quiz timer
export const QUESTION_TIMER_SECONDS = 15
export const TIMER_WARNING_SECONDS = 5
export const TIMER_CRITICAL_SECONDS = 3

// XP rewards
export const XP_QUIZ_STARTED = 5
export const XP_CORRECT_ANSWER = 20
export const XP_SPEED_BONUS_FAST = 15   // <= 3s
export const XP_SPEED_BONUS_MEDIUM = 5  // 4-7s
export const XP_PERFECT_QUIZ = 50       // 5/5
export const XP_DAILY_GOAL = 100
export const XP_STREAK_BASE = 10

// Speed bonus thresholds (seconds)
export const SPEED_FAST_THRESHOLD = 3
export const SPEED_MEDIUM_THRESHOLD = 7

// Streak
export const STREAK_MULTIPLIER_CAP = 2.0
export const STREAK_MULTIPLIER_DIVISOR = 50
export const STREAK_FREEZES_PER_MONTH = 3
export const STREAK_RESET_HOUR_CET = 4

// Quiz
export const QUESTIONS_PER_QUIZ = 5

// Categories
export const CATEGORIES = [
  'Ecosystem & Culture',
  'Foundational Knowledge',
  'KPIs / Expert Knowledge',
  'Trends & Tech',
  'Startups vs. Other Asset Classes',
]

// Supported languages
export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Francais', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'es', label: 'Espanol', flag: '🇪🇸' },
]

// Demo account
export const DEMO_EMAIL = 'demo@akka.app'
export const DEMO_PASSWORD = 'demo123456'
