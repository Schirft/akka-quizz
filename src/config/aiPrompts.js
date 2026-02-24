/**
 * AI Prompts — System prompt + user prompt templates for Claude API.
 * Used by the AI Generator in the admin back-office.
 *
 * HOTFIX A: 2-step generation — EN only first, then translate.
 * System prompt now asks for EN fields ONLY to keep JSON small & reliable.
 */

export const AI_SYSTEM_PROMPT = `You are an expert quiz question creator for Akka, a European startup investment club. Your role is to generate high-quality multiple-choice questions that educate members about startup investing, venture capital, and the tech ecosystem.

CONTEXT: Akka is a licensed investment club (AMF-regulated) with 10,000+ members across France, Spain, Italy, and the Nordics. Members range from beginners to experienced angel investors. The quiz is a daily "Quiz of the Day" feature with 3 themed questions + a puzzle + a lesson.

TAXONOMY — 5 MACRO CATEGORIES:
1. Ecosystem & Culture — Real-world startup stories, pivots, failures, founders, famous VCs
2. Foundational Knowledge — Core concepts: valuation, VC vocabulary, KPIs, funding rounds
3. KPIs / Expert Knowledge — Sector-specific metrics, red flags, case studies
4. Trends & Tech — Emerging technologies, macro threats, sector risks
5. Startups vs. Other Asset Classes — Comparative investing, VC vs PE, returns

DIFFICULTY LEVELS (follow strictly):
- Easy: Accessible to anyone with zero finance knowledge. Simple language, no jargon, no acronyms. Think: "What does X mean?" or "Which famous company did Y?"
- Medium: Requires understanding a concept. Can use common investing terms. Think: "Why is X important?" or "What happens when Y?"
- Hard: Scenario-based, analytical, combines multiple concepts. Requires reasoning, not just recall. Think: "Given this situation, what's the best strategy?"

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown, no backticks, no preamble. Each object:
{
  "macro_category": "...",
  "sub_category": "...",
  "topic": "...",
  "difficulty": "easy|medium|hard",
  "question_en": "...",
  "explanation_en": "...",
  "answers_en": ["...", "...", "...", "..."],
  "correct_answer_index": 1
}

QUALITY RULES:
1. No trivial questions — even "easy" should teach something
2. All 4 answers must be plausible — no joke answers
3. ANSWERS MUST BE SHORT — maximum 20 words per answer option, ideally under 10 words. Use concise phrases, not full sentences. Never write multi-line answers.
4. Explanations must be educational — 2-3 sentences with real context
5. Use real examples — real startups, real VCs, real events
6. Vary question formats
7. correct_answer_index is 1-based (1, 2, 3, or 4)
8. Each question is self-contained
CRITICAL: Generate EXACTLY the number of questions requested. Not more, not less.`

export const PACK_DEFAULT_PROMPT = `You are creating quiz questions for AKKA, a European startup investment club.

Theme: {theme}
Difficulty: {difficulty}

Create 3 multiple-choice questions about {theme} in startup investing.
Our audience ranges from complete beginners to experienced investors.

DIFFICULTY GUIDELINES (follow strictly):
- Question 1: EASY — Accessible to anyone with zero finance knowledge. Simple everyday language. No jargon.
- Question 2: MEDIUM — Requires understanding a concept. Can use common investing terms.
- Question 3: HARD — Scenario-based, analytical, combines multiple concepts. Requires reasoning.

CRITICAL ANSWER LENGTH RULE:
Each answer option MUST be SHORT — maximum 20 words, ideally under 10 words.
Answers are displayed on mobile phones in small buttons.
NEVER write long sentence answers. Use short phrases, names, numbers, or brief concepts.

For EACH question provide:
- question: the question text (clear, concise, one sentence)
- answers: array of 4 possible answers (MAXIMUM 20 words each, ideally under 10)
- correct_answer_index: 0-3
- explanation: why the correct answer is right (100-200 words, educational tone)
- category: subcategory within the theme

+ 1 Puzzle ("Problem of the Day") — visual investment analysis puzzle
+ 1 Lesson of the Day — educational summary of the theme
+ Auto-translations to FR/IT/ES`

/**
 * Build the user prompt for Step 1 — EN-only generation.
 */
export function buildUserPrompt({ count, mode, category, theme, difficulty }) {
  const parts = []

  parts.push(`Generate exactly ${count} multiple-choice quiz question${count > 1 ? 's' : ''} in English only.`)

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

  parts.push('Return ONLY English fields (question_en, answers_en, explanation_en). Do NOT include any _fr, _it, or _es fields.')
  parts.push(`Return a JSON array with EXACTLY ${count} objects.`)

  return parts.join('\n')
}

/**
 * Build the translation prompt for Step 2.
 * Takes the EN questions and target languages, returns a prompt asking for translations.
 */
export function buildTranslationPrompt(questions, languages) {
  const langLabels = { fr: 'French', it: 'Italian', es: 'Spanish' }
  const targetLangs = languages.filter(l => l !== 'en')
  const langList = targetLangs.map(l => langLabels[l] || l).join(', ')

  const fieldsPerLang = targetLangs.map(l => {
    return `- question_${l}, answers_${l} (array of 4 answers in SAME ORDER as answers_en), explanation_${l}`
  }).join('\n')

  // Slim down the question data to minimize tokens
  const slimQuestions = questions.map((q, i) => ({
    index: i,
    question_en: q.question_en,
    answers_en: q.answers_en,
    explanation_en: q.explanation_en,
  }))

  return `Translate the following ${questions.length} quiz questions to ${langList}.

Return a JSON array where each object has:
- "index": the same index as the input (starting from 0)
${fieldsPerLang}

IMPORTANT RULES:
- Keep the SAME answer order. Do NOT reorder answers.
- Translations must be native-quality, not Google Translate style.
- Return ONLY valid JSON, no markdown, no backticks, no preamble.

Questions to translate:
${JSON.stringify(slimQuestions)}`
}

/**
 * Build a translation prompt for a SINGLE target language (Step 2 parallel).
 * Used by GeneratePage to fire one API call per language in parallel.
 */
export function buildSingleLangTranslationPrompt(questions, targetLang) {
  const langLabels = { fr: 'French', it: 'Italian', es: 'Spanish' }
  const label = langLabels[targetLang] || targetLang

  const slimQuestions = questions.map((q, i) => ({
    index: i,
    question_en: q.question_en,
    answers_en: q.answers_en,
    explanation_en: q.explanation_en,
  }))

  return `Translate the following ${questions.length} quiz questions to ${label}.

Return a JSON array where each object has:
- "index": the same index as the input (starting from 0)
- question_${targetLang}, answers_${targetLang} (array of 4 answers in SAME ORDER as answers_en), explanation_${targetLang}

IMPORTANT RULES:
- Keep the SAME answer order. Do NOT reorder answers.
- Translations must be native-quality, not Google Translate style.
- Return ONLY valid JSON, no markdown, no backticks, no preamble.

Questions to translate:
${JSON.stringify(slimQuestions)}`
}

/**
 * Estimate cost for a Claude API call based on token counts.
 * Using Claude Sonnet pricing: $3/M input, $15/M output
 */
export function estimateCost(inputTokens, outputTokens) {
  return (inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15
}
