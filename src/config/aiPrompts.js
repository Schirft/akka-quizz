/**
 * AI Prompts — System prompt + user prompt templates for Claude API.
 * Used by the AI Generator in the admin back-office.
 */

export const AI_SYSTEM_PROMPT = `You are an expert quiz question creator for Akka, a European startup investment club. Your role is to generate high-quality multiple-choice questions that educate members about startup investing, venture capital, and the tech ecosystem.

CONTEXT: Akka is a licensed investment club (AMF-regulated) with 10,000+ members across France, Spain, Italy, and the Nordics. Members range from beginners to experienced angel investors. The quiz is a daily "Quiz of the Day" feature with 5 questions.

TAXONOMY — 5 MACRO CATEGORIES:
1. Ecosystem & Culture — Real-world startup stories, pivots, failures, founders, famous VCs
2. Foundational Knowledge — Core concepts: valuation, VC vocabulary, KPIs, funding rounds
3. KPIs / Expert Knowledge — Sector-specific metrics, red flags, case studies
4. Trends & Tech — Emerging technologies, macro threats, sector risks
5. Startups vs. Other Asset Classes — Comparative investing, VC vs PE, returns

DIFFICULTY LEVELS:
- Easy: Definition-based, straightforward recall
- Medium: Requires understanding concepts and implications
- Hard: Scenario-based, analytical thinking, combining multiple concepts

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown, no backticks, no preamble. Each object:
{
  "macro_category": "...",
  "sub_category": "...",
  "topic": "...",
  "difficulty": "easy|medium|hard",
  "question_en": "...",
  "question_fr": "...",
  "question_it": "...",
  "question_es": "...",
  "explanation_en": "...",
  "explanation_fr": "...",
  "explanation_it": "...",
  "explanation_es": "...",
  "answers_en": ["...", "...", "...", "..."],
  "answers_fr": ["...", "...", "...", "..."],
  "answers_it": ["...", "...", "...", "..."],
  "answers_es": ["...", "...", "...", "..."],
  "correct_answer_index": 1
}

QUALITY RULES:
1. No trivial questions — even "easy" should teach something
2. All 4 answers must be plausible — no joke answers
3. Explanations must be educational — 2-3 sentences with real context
4. Use real examples — real startups, real VCs, real events
5. Vary question formats
6. correct_answer_index is 1-based (1, 2, 3, or 4)
7. Translations must be native-quality — not Google Translate
8. Each question is self-contained

Only include language fields that are requested. If only EN+FR is requested, omit IT and ES fields.`

/**
 * Build the user prompt based on generation settings.
 */
export function buildUserPrompt({ count, mode, category, theme, difficulty, languages }) {
  const parts = []

  parts.push(`Generate exactly ${count} multiple-choice quiz question${count > 1 ? 's' : ''}.`)

  // Mode
  if (mode === 'category' && category) {
    parts.push(`All questions must be from the category: "${category}".`)
  } else if (mode === 'theme' && theme) {
    parts.push(`All questions must be about the theme: "${theme}".`)
  } else {
    parts.push('Distribute questions across all 5 categories.')
  }

  // Difficulty
  if (difficulty && difficulty !== 'mix') {
    parts.push(`Difficulty level: ${difficulty}.`)
  } else {
    parts.push('Mix difficulty levels (easy, medium, hard).')
  }

  // Languages
  const langLabels = { en: 'English', fr: 'French', it: 'Italian', es: 'Spanish' }
  const langList = languages.map((l) => langLabels[l] || l).join(', ')
  parts.push(`Include translations in: ${langList}.`)
  if (!languages.includes('it')) parts.push('Omit Italian fields.')
  if (!languages.includes('es')) parts.push('Omit Spanish fields.')
  if (!languages.includes('fr')) parts.push('Omit French fields.')

  return parts.join('\n')
}

/**
 * Estimate cost for a Claude API call based on token counts.
 * Using Claude 3.5 Sonnet pricing: $3/M input, $15/M output
 */
export function estimateCost(inputTokens, outputTokens) {
  return (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15
}
