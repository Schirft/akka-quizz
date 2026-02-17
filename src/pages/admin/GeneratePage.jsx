import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { CATEGORIES } from '../../config/constants'
import {
  getGenerationSystemPrompt,
  getGenerationUserPrompt,
  getTranslationSystemPrompt,
  getTranslationUserPrompt,
} from '../../config/aiPrompts'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Sparkles, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

const DIFFICULTIES = ['easy', 'medium', 'hard']
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-sonnet-4-20250514'

/**
 * Parse JSON from a potentially messy AI response.
 * Handles markdown code fences, trailing text, etc.
 */
function parseAIJSON(text) {
  // Strip markdown code fences
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '')
  // Try to find the JSON array
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }
}

/**
 * Call OpenRouter API for chat completion.
 */
async function callAI(systemPrompt, userPrompt) {
  const apiKey = localStorage.getItem('akka_openrouter_key')
  if (!apiKey) throw new Error('OpenRouter API key not set. Add it in settings.')

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI API error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * GeneratePage — AI question generator with parallel translation.
 */
export default function GeneratePage() {
  const { user } = useAuth()
  const [count, setCount] = useState(5)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [difficulty, setDifficulty] = useState('medium')
  const [theme, setTheme] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    setGenerating(true)
    setProgress('Generating questions in English...')
    setResult(null)
    setError(null)
    const startTime = Date.now()

    try {
      // Step 1: Generate questions in English
      const enResponse = await callAI(
        getGenerationSystemPrompt(),
        getGenerationUserPrompt({ count, category, difficulty, theme })
      )

      const questionsEN = parseAIJSON(enResponse)
      if (!questionsEN || !Array.isArray(questionsEN)) {
        throw new Error('Failed to parse AI response as JSON array')
      }

      if (questionsEN.length < count) {
        console.warn(`Expected ${count} questions, got ${questionsEN.length}`)
      }

      // Step 2: Translate to FR, IT, ES — IN PARALLEL
      setProgress('Translating to FR, IT, ES (parallel)...')

      const translationPromises = ['fr', 'it', 'es'].map((lang) =>
        callAI(
          getTranslationSystemPrompt(),
          getTranslationUserPrompt(questionsEN, lang)
        ).then((response) => {
          const parsed = parseAIJSON(response)
          return { lang, data: parsed }
        }).catch((err) => {
          console.error(`Translation ${lang} failed:`, err)
          return { lang, data: null }
        })
      )

      const translations = await Promise.allSettled(translationPromises)

      const translated = {}
      for (const result of translations) {
        const val = result.status === 'fulfilled' ? result.value : null
        if (val?.data) {
          translated[val.lang] = val.data
        }
      }

      // Step 3: Insert into Supabase
      setProgress('Saving to database...')

      // Create batch record
      const { data: batch } = await supabase
        .from('ai_generation_batches')
        .insert({
          requested_count: count,
          mode: 'generate',
          category,
          theme: theme || null,
          difficulty,
          languages: ['en', 'fr', 'it', 'es'],
          generated_count: questionsEN.length,
          approved_count: 0,
          rejected_count: 0,
          failed_count: 0,
          duration_seconds: Math.round((Date.now() - startTime) / 1000),
          created_by: user?.id || null,
          status: 'completed',
        })
        .select('id')
        .single()

      let inserted = 0
      for (let i = 0; i < questionsEN.length; i++) {
        const q = questionsEN[i]
        const frQ = translated.fr?.[i]
        const itQ = translated.it?.[i]
        const esQ = translated.es?.[i]

        const { error: insertErr } = await supabase.from('questions').insert({
          macro_category: category,
          sub_category: q.sub_category || category,
          topic: q.topic || theme || category,
          difficulty: q.difficulty || difficulty,
          question_en: q.question,
          question_fr: frQ?.question || null,
          question_it: itQ?.question || null,
          question_es: esQ?.question || null,
          explanation_en: q.explanation,
          explanation_fr: frQ?.explanation || null,
          explanation_it: itQ?.explanation || null,
          explanation_es: esQ?.explanation || null,
          answers_en: q.answers,
          answers_fr: frQ?.answers || null,
          answers_it: itQ?.answers || null,
          answers_es: esQ?.answers || null,
          correct_answer_index: q.correct_answer_index,
          status: 'pending_review',
          source: 'ai',
          generation_batch_id: batch?.id || null,
        })

        if (insertErr) {
          console.error('Insert error:', insertErr)
        } else {
          inserted++
        }
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000)
      setResult({
        generated: questionsEN.length,
        inserted,
        translations: {
          fr: !!translated.fr,
          it: !!translated.it,
          es: !!translated.es,
        },
        elapsed,
      })
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message)
    } finally {
      setGenerating(false)
      setProgress('')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-akka-text mb-6">AI Generator</h1>

      {/* API Key notice */}
      {!localStorage.getItem('akka_openrouter_key') && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">OpenRouter API Key Required</p>
              <p className="text-xs text-amber-600 mt-1">
                Set your key in the browser console:{' '}
                <code className="bg-amber-100 px-1 rounded">
                  localStorage.setItem('akka_openrouter_key', 'sk-or-...')
                </code>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Config form */}
      <Card className="mb-4">
        <div className="space-y-4">
          {/* Count */}
          <div>
            <label className="text-xs font-semibold text-akka-text-secondary uppercase tracking-wide">
              Number of Questions
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-akka-border px-3 py-2 text-sm"
            >
              {[3, 5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-akka-text-secondary uppercase tracking-wide">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-akka-border px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-xs font-semibold text-akka-text-secondary uppercase tracking-wide">
              Difficulty
            </label>
            <div className="flex gap-2 mt-1">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    difficulty === d
                      ? 'bg-akka-green text-white'
                      : 'bg-gray-100 text-akka-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="text-xs font-semibold text-akka-text-secondary uppercase tracking-wide">
              Theme / Topic (optional)
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g., Series A funding, AI startups..."
              className="mt-1 w-full rounded-lg border border-akka-border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Generate button */}
      <Button
        variant="secondary"
        className="w-full gap-2 mb-4"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {progress || 'Generating...'}
          </>
        ) : (
          <>
            <Sparkles size={18} />
            Generate Questions
          </>
        )}
      </Button>

      {/* Result */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <div className="flex items-start gap-2">
            <CheckCircle size={18} className="text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Generation Complete</p>
              <ul className="text-xs text-green-700 mt-1 space-y-0.5">
                <li>Generated: {result.generated} questions</li>
                <li>Inserted: {result.inserted} into database</li>
                <li>
                  Translations: FR {result.translations.fr ? '✓' : '✗'} | IT{' '}
                  {result.translations.it ? '✓' : '✗'} | ES{' '}
                  {result.translations.es ? '✓' : '✗'}
                </li>
                <li>Time: {result.elapsed}s</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
