/**
 * Edge Function: translate-pack
 *
 * Translates all pack content (questions, puzzle, lesson) into FR/IT/ES.
 * Updates existing rows in-place with translated fields.
 *
 * Body: { question_ids: string[], puzzle_id: string, lesson_id: string }
 * Returns: { success, translated: { questions, puzzle, lesson } }
 *
 * Deployment:
 *   supabase functions deploy translate-pack --no-verify-jwt
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };
}

async function callClaude(prompt: string, maxTokens = 8192): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function callClaudeWithRetry(prompt: string, maxTokens = 8192, retries = 5): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callClaude(prompt, maxTokens);
    } catch (err: any) {
      const msg = err.message || "";
      const isRetryable = msg.includes("529") || msg.includes("500") || msg.includes("overloaded") || msg.includes("rate");
      if (isRetryable && attempt < retries) {
        const delay = Math.min(attempt * 8000, 40000);
        console.log(`[Retry] Attempt ${attempt}/${retries} failed, waiting ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("All retry attempts failed");
}

function extractJSON(text: string): any {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");
  if (arrStart >= 0 && arrEnd > arrStart) return JSON.parse(text.slice(arrStart, arrEnd + 1));
  throw new Error("No valid JSON found in response");
}

function buildTranslationPrompt(fields: Record<string, string>): string {
  const entries = Object.entries(fields)
    .filter(([_, v]) => v && v.trim())
    .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
    .join(",\n  ");

  const keys = Object.keys(fields);

  return `Translate ALL the following fields into French (fr), Italian (it), and Spanish (es).
Keep the same JSON keys. Maintain formatting (paragraphs, bullet points).

Return ONLY valid JSON:
{
  "fr": { ${keys.map((k) => `"${k}": "..."`).join(", ")} },
  "it": { ${keys.map((k) => `"${k}": "..."`).join(", ")} },
  "es": { ${keys.map((k) => `"${k}": "..."`).join(", ")} }
}

Fields to translate:
{
  ${entries}
}`;
}

/**
 * C1: Extract translatable string values from puzzle context_data.
 * Recursively finds string fields that look like user-facing text.
 */
function extractContextDataStrings(contextData: any, prefix = "ctx"): Record<string, string> {
  const result: Record<string, string> = {};
  if (!contextData || typeof contextData !== "object") return result;

  function walk(obj: any, path: string) {
    if (typeof obj === "string" && obj.trim().length > 2) {
      // Skip IDs, types, and short codes
      if (!path.endsWith("_id") && !path.endsWith("_type") && !path.endsWith("type") && obj.length > 3) {
        result[path] = obj;
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, i) => walk(item, `${path}_${i}`));
    } else if (typeof obj === "object" && obj !== null) {
      for (const [key, val] of Object.entries(obj)) {
        // Skip numeric and id fields
        if (key === "id" || key === "type" || key === "chart_type") continue;
        walk(val, `${path}_${key}`);
      }
    }
  }

  walk(contextData, prefix);
  return result;
}

/**
 * C1: Rebuild context_data with translated strings for a given language.
 */
function rebuildContextData(contextData: any, translations: Record<string, string>, prefix = "ctx"): any {
  if (!contextData || typeof contextData !== "object") return contextData;

  function walk(obj: any, path: string): any {
    if (typeof obj === "string") {
      return translations[path] || obj;
    } else if (Array.isArray(obj)) {
      return obj.map((item, i) => walk(item, `${path}_${i}`));
    } else if (typeof obj === "object" && obj !== null) {
      const rebuilt: any = {};
      for (const [key, val] of Object.entries(obj)) {
        if (key === "id" || key === "type" || key === "chart_type") {
          rebuilt[key] = val;
        } else {
          rebuilt[key] = walk(val, `${path}_${key}`);
        }
      }
      return rebuilt;
    }
    return obj;
  }

  return walk(contextData, prefix);
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const questionIds: string[] = body.question_ids || [];
    const puzzleId: string | null = body.puzzle_id || null;
    const lessonId: string | null = body.lesson_id || null;

    const startTime = Date.now();

    // ─── Load existing data ──────────────────────────────────────────────
    let questions: any[] = [];
    let puzzle: any = null;
    let lesson: any = null;

    if (questionIds.length > 0) {
      const { data } = await supabase
        .from("questions")
        .select("id, question_en, answers_en, explanation_en")
        .in("id", questionIds);
      questions = data || [];
    }

    if (puzzleId) {
      const { data } = await supabase
        .from("puzzles")
        .select("id, title, hint, explanation, context_data")
        .eq("id", puzzleId)
        .single();
      puzzle = data;
    }

    if (lessonId) {
      const { data } = await supabase
        .from("daily_lessons")
        .select("id, title, content, key_takeaway")
        .eq("id", lessonId)
        .single();
      lesson = data;
    }

    // ─── Build translation fields ────────────────────────────────────────
    const transFields: Record<string, string> = {};

    // Questions
    questions.forEach((q: any, i: number) => {
      transFields[`q${i}_question`] = q.question_en || "";
      transFields[`q${i}_explanation`] = q.explanation_en || "";
      if (q.answers_en) {
        q.answers_en.forEach((a: string, j: number) => {
          transFields[`q${i}_answer_${j}`] = a;
        });
      }
    });

    // Puzzle
    if (puzzle) {
      transFields["puzzle_title"] = puzzle.title || "";
      transFields["puzzle_hint"] = puzzle.hint || "";
      transFields["puzzle_explanation"] = puzzle.explanation || "";

      // C1: Extract puzzle context_data translatable strings
      const ctxStrings = extractContextDataStrings(puzzle.context_data);
      for (const [key, val] of Object.entries(ctxStrings)) {
        transFields[key] = val;
      }
    }

    // Lesson
    if (lesson) {
      transFields["lesson_title"] = lesson.title || "";
      transFields["lesson_content"] = lesson.content || "";
      transFields["lesson_key_takeaway"] = lesson.key_takeaway || "";
    }

    // ─── Call Claude for translation ─────────────────────────────────────
    console.log(`[TranslatePack] Translating ${Object.keys(transFields).length} fields...`);

    let translations: any = { fr: {}, it: {}, es: {} };
    try {
      const transResp = await callClaudeWithRetry(buildTranslationPrompt(transFields), 8192);
      translations = extractJSON(transResp);
    } catch (err) {
      console.error("[TranslatePack] Translation failed:", err);
      throw new Error(`Translation failed: ${(err as Error).message}`);
    }

    const fr = translations.fr || {};
    const it = translations.it || {};
    const es = translations.es || {};

    // ─── Update Questions ────────────────────────────────────────────────
    let questionsUpdated = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const answersEn = q.answers_en || [];
      const answersFr = answersEn.map((_: string, j: number) => fr[`q${i}_answer_${j}`] || answersEn[j]);
      const answersIt = answersEn.map((_: string, j: number) => it[`q${i}_answer_${j}`] || answersEn[j]);
      const answersEs = answersEn.map((_: string, j: number) => es[`q${i}_answer_${j}`] || answersEn[j]);

      const { error: uErr } = await supabase
        .from("questions")
        .update({
          question_fr: fr[`q${i}_question`] || "",
          question_it: it[`q${i}_question`] || "",
          question_es: es[`q${i}_question`] || "",
          answers_fr: answersFr,
          answers_it: answersIt,
          answers_es: answersEs,
          explanation_fr: fr[`q${i}_explanation`] || "",
          explanation_it: it[`q${i}_explanation`] || "",
          explanation_es: es[`q${i}_explanation`] || "",
        })
        .eq("id", q.id);

      if (!uErr) questionsUpdated++;
      else console.error(`[TranslatePack] Question update error for ${q.id}:`, uErr);
    }

    // ─── Update Puzzle ───────────────────────────────────────────────────
    let puzzleUpdated = false;
    if (puzzle) {
      // C1: Rebuild context_data with translations for each language
      const contextDataFr = rebuildContextData(puzzle.context_data, fr);
      const contextDataIt = rebuildContextData(puzzle.context_data, it);
      const contextDataEs = rebuildContextData(puzzle.context_data, es);

      const { error: pErr } = await supabase
        .from("puzzles")
        .update({
          title_fr: fr["puzzle_title"] || "",
          title_it: it["puzzle_title"] || "",
          title_es: es["puzzle_title"] || "",
          hint_fr: fr["puzzle_hint"] || "",
          hint_it: it["puzzle_hint"] || "",
          hint_es: es["puzzle_hint"] || "",
          explanation_fr: fr["puzzle_explanation"] || "",
          explanation_it: it["puzzle_explanation"] || "",
          explanation_es: es["puzzle_explanation"] || "",
          context_data_fr: contextDataFr,
          context_data_it: contextDataIt,
          context_data_es: contextDataEs,
        })
        .eq("id", puzzle.id);

      if (!pErr) puzzleUpdated = true;
      else console.error("[TranslatePack] Puzzle update error:", pErr);
    }

    // ─── Update Lesson ───────────────────────────────────────────────────
    let lessonUpdated = false;
    if (lesson) {
      const { error: lErr } = await supabase
        .from("daily_lessons")
        .update({
          title_fr: fr["lesson_title"] || "",
          title_it: it["lesson_title"] || "",
          title_es: es["lesson_title"] || "",
          content_fr: fr["lesson_content"] || "",
          content_it: it["lesson_content"] || "",
          content_es: es["lesson_content"] || "",
          key_takeaway_fr: fr["lesson_key_takeaway"] || "",
          key_takeaway_it: it["lesson_key_takeaway"] || "",
          key_takeaway_es: es["lesson_key_takeaway"] || "",
        })
        .eq("id", lesson.id);

      if (!lErr) lessonUpdated = true;
      else console.error("[TranslatePack] Lesson update error:", lErr);
    }

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        translated: {
          questions: questionsUpdated,
          puzzle: puzzleUpdated,
          lesson: lessonUpdated,
        },
        stats: {
          duration_ms: durationMs,
          duration_s: Math.round(durationMs / 1000),
          api_calls: 1,
          estimated_cost_usd: +(1 * 0.02).toFixed(3),
        },
      }),
      { headers: corsHeaders() }
    );
  } catch (err) {
    console.error("translate-pack error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders() }
    );
  }
});
