import { CATEGORIES } from './constants'

/**
 * AI prompt templates for question generation and translation.
 */

export function getGenerationSystemPrompt() {
  return `You are an expert quiz question writer for Akka, a mobile quiz app about venture capital, startups, and private equity.

RULES:
- Questions must be factual, educational, and relevant to VC/startup professionals.
- Each question has exactly 4 answer options with 1 correct answer.
- Include a short explanation (1-2 sentences) for the correct answer.
- Difficulty levels: easy, medium, hard.
- CRITICAL: You MUST generate EXACTLY the number of questions requested. Not more, not less. Count them before returning.

Available categories: ${CATEGORIES.join(', ')}

Always return valid JSON.`
}

export function getGenerationUserPrompt({ count, category, difficulty, theme }) {
  return `Generate exactly ${count} quiz questions about "${theme || category}".
Category: ${category}
Difficulty: ${difficulty}

Return a JSON array with exactly ${count} objects. Each object:
{
  "question": "The question text in English",
  "answers": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer_index": 0,
  "explanation": "Short explanation of the correct answer",
  "topic": "Specific topic keyword",
  "sub_category": "${category}",
  "difficulty": "${difficulty}"
}

IMPORTANT: Return EXACTLY ${count} questions. Count them before returning. The JSON array must have exactly ${count} elements.`
}

export function getTranslationSystemPrompt() {
  return `You are a professional translator for an educational quiz app about venture capital and startups. Translate quiz questions, answers, and explanations accurately while preserving financial/technical terminology. Return valid JSON only.`
}

export function getTranslationUserPrompt(questions, targetLang) {
  const langNames = { fr: 'French', it: 'Italian', es: 'Spanish' }
  const langName = langNames[targetLang] || targetLang

  return `Translate these quiz questions to ${langName}. Keep the same JSON structure.
Return a JSON array with the same number of elements (${questions.length}).

For each question, translate:
- "question" field
- All 4 items in the "answers" array
- "explanation" field

Do NOT translate: correct_answer_index, topic, sub_category, difficulty.

Input:
${JSON.stringify(questions, null, 2)}

Return ONLY the translated JSON array, no extra text.`
}
