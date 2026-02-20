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
  // Try code block first
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = jsonMatch ? jsonMatch[1].trim() : (() => {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return text.slice(start, end + 1);
    const arrStart = text.indexOf("[");
    const arrEnd = text.lastIndexOf("]");
    if (arrStart >= 0 && arrEnd > arrStart) return text.slice(arrStart, arrEnd + 1);
    throw new Error("No valid JSON found in response");
  })();

  // Try parsing as-is first
  try { return JSON.parse(raw); } catch (_) { /* try fixes */ }

  // Fix common JSON issues from LLM output:
  // 1. Replace literal newlines inside strings with \n
  // 2. Fix unescaped quotes inside strings
  let cleaned = raw;
  // Replace literal control chars inside string values
  cleaned = cleaned.replace(/:\s*"((?:[^"\\]|\\.)*)"/g, (_match, content) => {
    const fixed = content
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `: "${fixed}"`;
  });
  try { return JSON.parse(cleaned); } catch (_) { /* try more aggressive fix */ }

  // More aggressive: try to fix by removing all control characters
  cleaned = raw.replace(/[\x00-\x1f\x7f]/g, (ch) => {
    if (ch === "\n" || ch === "\r" || ch === "\t") return " ";
    return "";
  });
  try { return JSON.parse(cleaned); } catch (e) {
    throw new Error(`JSON parse failed after cleanup: ${(e as Error).message}`);
  }
}

function buildTranslationPrompt(fields: Record<string, string>): string {
  const entries = Object.entries(fields)
    .filter(([_, v]) => v && v.trim())
    .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
    .join(",\n  ");

  const keys = Object.keys(fields);

  return `Translate ALL the following fields into French (fr), Italian (it), and Spanish (es).
Keep the same JSON keys. Maintain formatting (paragraphs, bullet points).
CRITICAL: Return ONLY valid JSON. Escape all special characters properly.
Do NOT use literal newlines inside JSON string values — use \\n instead.
Do NOT use unescaped quotes inside string values — use \\" instead.

Return ONLY valid JSON (no markdown, no explanation):
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

    // ─── Helper: translate a small set of fields via Claude ──────────────
    async function translateFields(fields: Record<string, string>): Promise<{ fr: Record<string, string>; it: Record<string, string>; es: Record<string, string> }> {
      const prompt = buildTranslationPrompt(fields);
      const resp = await callClaudeWithRetry(prompt, 8192);
      const parsed = extractJSON(resp);
      return { fr: parsed.fr || {}, it: parsed.it || {}, es: parsed.es || {} };
    }

    // ─── Translate & Update Questions (one call per question for reliability) ──
    let questionsUpdated = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qFields: Record<string, string> = {
        question: q.question_en || "",
        explanation: q.explanation_en || "",
      };
      if (q.answers_en) {
        q.answers_en.forEach((a: string, j: number) => {
          qFields[`answer_${j}`] = a;
        });
      }

      console.log(`[TranslatePack] Translating question ${i + 1}/${questions.length}...`);
      try {
        const t = await translateFields(qFields);
        const answersEn = q.answers_en || [];
        const { error: uErr } = await supabase
          .from("questions")
          .update({
            question_fr: t.fr["question"] || "",
            question_it: t.it["question"] || "",
            question_es: t.es["question"] || "",
            answers_fr: answersEn.map((_: string, j: number) => t.fr[`answer_${j}`] || answersEn[j]),
            answers_it: answersEn.map((_: string, j: number) => t.it[`answer_${j}`] || answersEn[j]),
            answers_es: answersEn.map((_: string, j: number) => t.es[`answer_${j}`] || answersEn[j]),
            explanation_fr: t.fr["explanation"] || "",
            explanation_it: t.it["explanation"] || "",
            explanation_es: t.es["explanation"] || "",
          })
          .eq("id", q.id);
        if (!uErr) questionsUpdated++;
        else console.error(`[TranslatePack] Question update error for ${q.id}:`, uErr);
      } catch (err) {
        console.error(`[TranslatePack] Question ${i} translation failed:`, (err as Error).message);
      }
    }

    // ─── Translate & Update Puzzle ────────────────────────────────────────
    let puzzleUpdated = false;
    if (puzzle) {
      const pFields: Record<string, string> = {
        title: puzzle.title || "",
        hint: puzzle.hint || "",
        explanation: puzzle.explanation || "",
      };
      // C1: Extract puzzle context_data translatable strings
      const ctxStrings = extractContextDataStrings(puzzle.context_data);
      for (const [key, val] of Object.entries(ctxStrings)) {
        pFields[key] = val;
      }

      console.log(`[TranslatePack] Translating puzzle (${Object.keys(pFields).length} fields)...`);
      try {
        const t = await translateFields(pFields);
        const contextDataFr = rebuildContextData(puzzle.context_data, t.fr);
        const contextDataIt = rebuildContextData(puzzle.context_data, t.it);
        const contextDataEs = rebuildContextData(puzzle.context_data, t.es);

        const { error: pErr } = await supabase
          .from("puzzles")
          .update({
            title_fr: t.fr["title"] || "",
            title_it: t.it["title"] || "",
            title_es: t.es["title"] || "",
            hint_fr: t.fr["hint"] || "",
            hint_it: t.it["hint"] || "",
            hint_es: t.es["hint"] || "",
            explanation_fr: t.fr["explanation"] || "",
            explanation_it: t.it["explanation"] || "",
            explanation_es: t.es["explanation"] || "",
            context_data_fr: contextDataFr,
            context_data_it: contextDataIt,
            context_data_es: contextDataEs,
          })
          .eq("id", puzzle.id);
        if (!pErr) puzzleUpdated = true;
        else console.error("[TranslatePack] Puzzle update error:", pErr);
      } catch (err) {
        console.error("[TranslatePack] Puzzle translation failed:", (err as Error).message);
      }
    }

    // ─── Translate & Update Lesson ───────────────────────────────────────
    let lessonUpdated = false;
    if (lesson) {
      const lFields: Record<string, string> = {
        title: lesson.title || "",
        content: lesson.content || "",
        key_takeaway: lesson.key_takeaway || "",
      };

      console.log("[TranslatePack] Translating lesson...");
      try {
        const t = await translateFields(lFields);
        const { error: lErr } = await supabase
          .from("daily_lessons")
          .update({
            title_fr: t.fr["title"] || "",
            title_it: t.it["title"] || "",
            title_es: t.es["title"] || "",
            content_fr: t.fr["content"] || "",
            content_it: t.it["content"] || "",
            content_es: t.es["content"] || "",
            key_takeaway_fr: t.fr["key_takeaway"] || "",
            key_takeaway_it: t.it["key_takeaway"] || "",
            key_takeaway_es: t.es["key_takeaway"] || "",
          })
          .eq("id", lesson.id);
        if (!lErr) lessonUpdated = true;
        else console.error("[TranslatePack] Lesson update error:", lErr);
      } catch (err) {
        console.error("[TranslatePack] Lesson translation failed:", (err as Error).message);
      }
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
