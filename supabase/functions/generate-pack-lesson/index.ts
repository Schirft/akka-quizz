/**
 * Edge Function: generate-pack-lesson
 *
 * Generates 1 "Lesson of the Day" based on the puzzle context,
 * then auto-translates to FR/IT/ES.
 * Inserts it into the "daily_lessons" table and returns its ID.
 *
 * Body: { theme, puzzle_id, puzzle_title, puzzle_answer, puzzle_explanation }
 * Returns: { success, lesson_id }
 *
 * Deployment:
 *   supabase functions deploy generate-pack-lesson --no-verify-jwt
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

async function callClaude(prompt: string, maxTokens = 4096): Promise<string> {
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

async function callClaudeWithRetry(prompt: string, maxTokens = 4096, retries = 5): Promise<string> {
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

  // Fix common JSON issues from LLM output
  let cleaned = raw;
  cleaned = cleaned.replace(/:\s*"((?:[^"\\]|\\.)*)"/g, (_match: string, content: string) => {
    const fixed = content
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return `: "${fixed}"`;
  });
  try { return JSON.parse(cleaned); } catch (_) { /* try more aggressive fix */ }

  // More aggressive: remove all control characters
  cleaned = raw.replace(/[\x00-\x1f\x7f]/g, (ch: string) => {
    if (ch === "\n" || ch === "\r" || ch === "\t") return " ";
    return "";
  });
  try { return JSON.parse(cleaned); } catch (e) {
    throw new Error(`JSON parse failed after cleanup: ${(e as Error).message}`);
  }
}

// ─── Translation helper ──────────────────────────────────────────────────────

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

function buildLessonPrompt(theme: string, puzzleTitle: string, answer: string, explanation: string, visualType: string): string {
  const visualContextMap: Record<string, string> = {
    cap_table: "analyzing a shareholder cap table",
    bar_chart: "reading a revenue/MRR bar chart",
    term_sheet: "reviewing term sheet clauses",
    metric_cards: "evaluating pitch deck metrics",
    pnl_table: "analyzing a P&L statement",
    cohort_grid: "reading a retention cohort table",
    funding_timeline: "reviewing a fundraising timeline",
    unit_economics: "analyzing unit economics per order/transaction",
    investor_email: "reading a CEO investor update email",
    comp_table: "evaluating a comparable companies table",
  };

  const visualContext = visualType
    ? `\nPuzzle format: ${visualType} (${visualContextMap[visualType] || visualType})`
    : "";

  return `Based on this puzzle about ${theme}:
Title: ${puzzleTitle}
Flaw found: ${answer}
Explanation: ${explanation}${visualContext}

Write a "Lesson of the Day" for startup investors (300-500 words).

The lesson should DIRECTLY relate to what the user just experienced in the puzzle.
If the puzzle was about a cap table with percentages > 100%, teach them HOW to read a cap table.
If the puzzle was about buried bad news in an investor email, teach them WHAT to look for in updates.

Structure:
1. title: educational title (relate to the puzzle concept)
2. content: structured text with:
   - What is the concept (relate to the puzzle format: ${visualType || "generic"})
   - Why it matters for angel investors doing due diligence
   - How to spot this specific issue in real deals
   - A real-world example or analogy (use REAL startup examples when possible)
   - One actionable checklist item they can use immediately
3. key_takeaway: 1 sentence summary

Return ONLY valid JSON:
{ "title": "...", "content": "...", "key_takeaway": "..." }`;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const theme = body.theme || "fundraising";
    const puzzleId = body.puzzle_id || null;
    const puzzleTitle = body.puzzle_title || "Puzzle";
    const puzzleAnswer = body.puzzle_answer || "";
    const puzzleExplanation = body.puzzle_explanation || "";
    const puzzleVisualType = body.puzzle_visual_type || "";

    const startTime = Date.now();
    let apiCalls = 0;

    // ─── STEP 1: Generate lesson ────────────────────────────────────────
    console.log(`[PackLesson] Generating lesson for ${theme}...`);
    const lessonResp = await callClaudeWithRetry(
      buildLessonPrompt(theme, puzzleTitle, puzzleAnswer, puzzleExplanation, puzzleVisualType),
      4096
    );
    const lessonData = extractJSON(lessonResp);
    apiCalls++;

    // Insert Lesson (English only first)
    const { data: insertedLesson, error: lErr } = await supabase
      .from("daily_lessons")
      .insert({
        theme: theme,
        title: lessonData.title || "Lesson of the Day",
        content: lessonData.content || "",
        key_takeaway: lessonData.key_takeaway || "",
        puzzle_id: puzzleId,
        status: "active",
      })
      .select("id")
      .single();

    if (lErr) {
      console.error("[PackLesson] Lesson insert error:", lErr);
      throw new Error(`Lesson insert failed: ${lErr.message}`);
    }

    // ─── STEP 2: Translate to FR/IT/ES ──────────────────────────────────
    let translationSuccess = false;
    try {
      console.log(`[PackLesson] Translating lesson to FR/IT/ES...`);

      const lFields: Record<string, string> = {
        title: lessonData.title || "",
        content: lessonData.content || "",
        key_takeaway: lessonData.key_takeaway || "",
      };

      console.log(`[PackLesson] Translating ${Object.keys(lFields).length} fields...`);
      const prompt = buildTranslationPrompt(lFields);
      const resp = await callClaudeWithRetry(prompt, 8192);
      const parsed = extractJSON(resp);
      apiCalls++;

      const t = { fr: parsed.fr || {}, it: parsed.it || {}, es: parsed.es || {} };

      // Update lesson with translations
      const { error: uErr } = await supabase
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
        .eq("id", insertedLesson.id);

      if (uErr) {
        console.error("[PackLesson] Translation update error:", uErr);
      } else {
        translationSuccess = true;
        console.log("[PackLesson] Translations saved successfully");
      }
    } catch (tErr) {
      // Translation failure is non-fatal — lesson still exists in English
      console.error("[PackLesson] Translation failed (non-fatal):", (tErr as Error).message);
    }

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        lesson_id: insertedLesson.id,
        translated: translationSuccess,
        stats: {
          duration_ms: durationMs,
          duration_s: Math.round(durationMs / 1000),
          api_calls: apiCalls,
          estimated_cost_usd: +(apiCalls * 0.015).toFixed(3),
        },
      }),
      { headers: corsHeaders() }
    );
  } catch (err) {
    console.error("generate-pack-lesson error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders() }
    );
  }
});
