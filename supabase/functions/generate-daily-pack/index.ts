/**
 * Edge Function: generate-daily-pack
 *
 * Generates a complete daily challenge pack:
 *   - 3 QCM questions (easy/medium/hard)
 *   - 1 Puzzle "The Catch"
 *   - 1 Lesson of the Day
 *   - Translations in FR/IT/ES
 *
 * Body: { theme, count?, difficulty? }
 *
 * Deployment:
 *   supabase functions deploy generate-daily-pack --no-verify-jwt
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

function extractJSON(text: string): any {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1));
  // Try array
  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");
  if (arrStart >= 0 && arrEnd > arrStart) return JSON.parse(text.slice(arrStart, arrEnd + 1));
  throw new Error("No valid JSON found in response");
}

// ─── PROMPTS ────────────────────────────────────────────────────────────────

function buildQCMPrompt(theme: string, difficulty: string): string {
  return `You are creating quiz questions for AKKA, a European startup investment club.

Theme: ${theme}
Difficulty: ${difficulty}

Create 3 multiple-choice questions about ${theme} in startup investing:
- Question 1: Easy — general knowledge, culture, famous examples
- Question 2: Medium — analytical thinking, understanding concepts
- Question 3: Hard — scenario-based, requires deep understanding

For EACH question provide:
- question: the question text
- answers: array of 4 possible answers
- correct_answer_index: 0-3
- explanation: why the correct answer is right (100-200 words)
- category: subcategory within the theme

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "...",
      "answers": ["A", "B", "C", "D"],
      "correct_answer_index": 0,
      "explanation": "...",
      "category": "..."
    }
  ]
}`;
}

function buildPuzzlePrompt(theme: string, difficulty: string): string {
  return `You are creating an investment analysis puzzle for "The Catch" — a daily game where startup investors must solve a visual puzzle about real-looking startup data.

Theme: ${theme}
Difficulty: ${difficulty}

6 PUZZLE MECHANICS (choose the best one for this theme + difficulty):

MECHANIC 1: "SPOT THE FLAW" (tap to identify)
User sees a data document (cap table, chart, term sheet). One element is wrong/suspicious. User taps the problematic element.
interaction_type: "tap_to_spot"
context_data format: { "rows": [...] } or { "clauses": [...] } — each item has an "id" field
answer: the "id" of the wrong element

MECHANIC 2: "A/B COMPARISON" (pick the better deal)
User sees two deals/charts/scenarios side by side. User picks A or B. Then sees detailed breakdown of why.
interaction_type: "ab_choice"
context_data format: { "option_a": { "title": "Deal A", "metrics": {...} }, "option_b": { "title": "Deal B", "metrics": {...} }, "question": "Which deal gives you ≥3x return?" }
answer: "a" or "b"

MECHANIC 3: "FILL THE GAP" (choose the missing number)
A cap table, P&L, or financial table with ONE number replaced by "?". User picks from 3-4 options.
interaction_type: "fill_gap"
context_data format: { "rows": [...], "missing_field": {"row_id": "...", "field": "..."}, "options": [12, 15, 18, 22], "correct_option": 15 }
answer: the correct number

MECHANIC 4: "MATCH THE CHART" (match description to visual)
2-3 mini charts + 1 text description. User matches the description to the right chart.
interaction_type: "match_chart"
context_data format: { "charts": [{"id": "a", "type": "line", "data": [...], "label": "Chart A"}, ...], "description": "..." }
answer: "a" (the id of the matching chart)

MECHANIC 5: "BEFORE/AFTER" (find the inconsistency)
Two versions of the same document (before/after a round). One number changed incorrectly.
interaction_type: "before_after"
context_data format: { "before": { "title": "Pre-Series A", "rows": [...] }, "after": { "title": "Post-Series A", "rows": [...] }, "question": "Which number doesn't match the round terms?" }
answer: the "id" of the inconsistent element in "after"

MECHANIC 6: "CRASH POINT" (tap the danger moment on a timeline)
A cash balance curve or runway chart over 18-24 months. User taps the month where danger occurs.
interaction_type: "crash_point"
context_data format: { "chart_type": "cash_balance", "data": [{"month": "Jan 2025", "cash": 2400000}, ...], "monthly_burn": [{"month": "Jan 2025", "burn": 180000}, ...], "question": "In which month does the startup have less than 3 months of runway?" }
answer: "Sep 2025" (a specific month)

THEMES → BEST MECHANIC COMBINATIONS:
- Fundraising: ab_choice, fill_gap, before_after
- Cap Tables: tap_to_spot, fill_gap, before_after
- Term Sheets: tap_to_spot, ab_choice
- Unit Economics: fill_gap, tap_to_spot
- Revenue & Growth: match_chart, crash_point, tap_to_spot
- Burn Analysis: crash_point, tap_to_spot, fill_gap
- Market & Comps: tap_to_spot, ab_choice, match_chart

Create a puzzle and return ONLY valid JSON:
{
  "title": "The Phantom Shares",
  "subtitle": "Series A · SaaS · €5M",
  "puzzle_type": "${theme.toLowerCase().replace(/ /g, "_")}",
  "interaction_type": "tap_to_spot",
  "context_data": { ... },
  "hint": "Check if the total adds up",
  "answer": "advisor_shares_row",
  "explanation": "Detailed explanation 200-300 words...",
  "timer_seconds": 90
}

IMPORTANT:
- context_data MUST be valid JSON that a React frontend can render directly
- Every clickable/interactive element MUST have a unique "id" field
- The puzzle must be solvable — there is exactly ONE correct answer
- The explanation should teach a real investment concept
- Vary the mechanics — don't always use tap_to_spot`;
}

function buildLessonPrompt(theme: string, puzzleTitle: string, answer: string, explanation: string): string {
  return `Based on this puzzle about ${theme}:
Title: ${puzzleTitle}
Flaw found: ${answer}
Explanation: ${explanation}

Write a "Lesson of the Day" for startup investors (300-500 words):
1. title: educational title about the underlying concept
2. content: structured text with:
   - What is the concept
   - Why it matters for angel investors
   - How to spot this issue in real deals
   - A real-world example or analogy
   - One actionable takeaway
3. key_takeaway: 1 sentence summary

Return ONLY valid JSON:
{ "title": "...", "content": "...", "key_takeaway": "..." }`;
}

/**
 * Extract translatable string values from puzzle context_data.
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
 * Rebuild context_data with translated strings for a given language.
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

// ─── Generate one pack ──────────────────────────────────────────────────────

async function generateOnePack(theme: string, difficulty: string) {
  const results: any = { questions: [], puzzle: null, lesson: null };

  // CALL 1: Generate 3 QCM
  console.log(`[Pack] Generating 3 QCM for ${theme}...`);
  const qcmResp = await callClaude(buildQCMPrompt(theme, difficulty), 4096);
  const qcmData = extractJSON(qcmResp);
  const questions = qcmData.questions || [];

  // CALL 2: Generate 1 Puzzle
  console.log(`[Pack] Generating puzzle for ${theme}...`);
  const puzzleResp = await callClaude(buildPuzzlePrompt(theme, difficulty), 4096);
  const puzzleData = extractJSON(puzzleResp);

  // CALL 3: Generate 1 Lesson
  console.log(`[Pack] Generating lesson for ${theme}...`);
  const lessonResp = await callClaude(
    buildLessonPrompt(
      theme,
      puzzleData.title || "Puzzle",
      JSON.stringify(puzzleData.answer),
      puzzleData.explanation || ""
    ),
    4096
  );
  const lessonData = extractJSON(lessonResp);

  // CALL 4: Translate everything
  console.log(`[Pack] Translating pack for ${theme}...`);

  // Build translation fields for questions
  const transFields: Record<string, string> = {};
  questions.forEach((q: any, i: number) => {
    transFields[`q${i}_question`] = q.question;
    transFields[`q${i}_explanation`] = q.explanation;
    q.answers.forEach((a: string, j: number) => {
      transFields[`q${i}_answer_${j}`] = a;
    });
  });

  // Add puzzle fields
  transFields["puzzle_title"] = puzzleData.title || "";
  transFields["puzzle_hint"] = puzzleData.hint || "";
  transFields["puzzle_explanation"] = puzzleData.explanation || "";

  // Add lesson fields
  transFields["lesson_title"] = lessonData.title || "";
  transFields["lesson_content"] = lessonData.content || "";
  transFields["lesson_key_takeaway"] = lessonData.key_takeaway || "";

  let translations: any = { fr: {}, it: {}, es: {} };
  try {
    const transResp = await callClaude(buildTranslationPrompt(transFields), 8192);
    translations = extractJSON(transResp);
  } catch (err) {
    console.error("[Pack] Translation failed, using EN fallback:", err);
  }

  // CALL 5: Translate puzzle context_data (separate call — nested JSON needs its own pass)
  let contextDataFr: any = null;
  let contextDataIt: any = null;
  let contextDataEs: any = null;
  if (puzzleData.context_data) {
    try {
      console.log(`[Pack] Translating puzzle context_data for ${theme}...`);
      const ctxStrings = extractContextDataStrings(puzzleData.context_data);
      const ctxFieldCount = Object.keys(ctxStrings).length;
      if (ctxFieldCount > 0) {
        const ctxTransResp = await callClaude(buildTranslationPrompt(ctxStrings), 8192);
        const ctxTranslations = extractJSON(ctxTransResp);
        contextDataFr = rebuildContextData(puzzleData.context_data, ctxTranslations.fr || {});
        contextDataIt = rebuildContextData(puzzleData.context_data, ctxTranslations.it || {});
        contextDataEs = rebuildContextData(puzzleData.context_data, ctxTranslations.es || {});
        console.log(`[Pack] context_data translated (${ctxFieldCount} strings extracted)`);
      } else {
        console.log("[Pack] No translatable strings found in context_data");
      }
    } catch (err) {
      console.error("[Pack] context_data translation failed (non-blocking):", err);
    }
  }

  // ─── Insert Questions ─────────────────────────────────────────────────
  const difficultyLevels = ["easy", "medium", "hard"];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const fr = translations.fr || {};
    const it = translations.it || {};
    const es = translations.es || {};

    const answersEn = q.answers;
    const answersFr = q.answers.map((_: string, j: number) => fr[`q${i}_answer_${j}`] || q.answers[j]);
    const answersIt = q.answers.map((_: string, j: number) => it[`q${i}_answer_${j}`] || q.answers[j]);
    const answersEs = q.answers.map((_: string, j: number) => es[`q${i}_answer_${j}`] || q.answers[j]);

    const { data: insertedQ, error: qErr } = await supabase
      .from("questions")
      .insert({
        question_en: q.question,
        question_fr: fr[`q${i}_question`] || "",
        question_it: it[`q${i}_question`] || "",
        question_es: es[`q${i}_question`] || "",
        answers_en: answersEn,
        answers_fr: answersFr,
        answers_it: answersIt,
        answers_es: answersEs,
        correct_answer_index: (q.correct_answer_index || 0) + 1, // Convert 0-based to 1-based
        explanation_en: q.explanation || "",
        explanation_fr: fr[`q${i}_explanation`] || "",
        explanation_it: it[`q${i}_explanation`] || "",
        explanation_es: es[`q${i}_explanation`] || "",
        macro_category: q.category || theme,
        sub_category: theme,
        topic: theme,
        difficulty: difficultyLevels[i] || "medium",
        theme: theme,
        status: "approved",
        source: "ai_daily_pack",
      })
      .select("id")
      .single();

    if (qErr) {
      console.error(`[Pack] Question insert error:`, qErr);
    } else {
      results.questions.push(insertedQ);
    }
  }

  // ─── Insert Puzzle ────────────────────────────────────────────────────
  const fr = translations.fr || {};
  const it = translations.it || {};
  const es = translations.es || {};

  // A2: Normalize answer to string (DB column is text, not jsonb)
  const rawAnswer = puzzleData.answer;
  const answerStr = typeof rawAnswer === "object"
    ? JSON.stringify(rawAnswer)
    : String(rawAnswer ?? "");

  const { data: insertedPuzzle, error: pErr } = await supabase
    .from("puzzles")
    .insert({
      theme: theme,
      difficulty: difficulty,
      puzzle_type: puzzleData.puzzle_type || theme.toLowerCase().replace(/ /g, "_"),
      interaction_type: puzzleData.interaction_type || "tap_to_spot",
      title: puzzleData.title || "The Catch",
      title_fr: fr["puzzle_title"] || "",
      title_it: it["puzzle_title"] || "",
      title_es: es["puzzle_title"] || "",
      subtitle: puzzleData.subtitle || "",
      context_data: puzzleData.context_data || {},
      context_data_fr: contextDataFr || puzzleData.context_data || {},
      context_data_it: contextDataIt || puzzleData.context_data || {},
      context_data_es: contextDataEs || puzzleData.context_data || {},
      hint: puzzleData.hint || "",
      hint_fr: fr["puzzle_hint"] || "",
      hint_it: it["puzzle_hint"] || "",
      hint_es: es["puzzle_hint"] || "",
      answer: answerStr,
      explanation: puzzleData.explanation || "",
      explanation_fr: fr["puzzle_explanation"] || "",
      explanation_it: it["puzzle_explanation"] || "",
      explanation_es: es["puzzle_explanation"] || "",
      timer_seconds: puzzleData.timer_seconds || 90,
      status: "active",
    })
    .select("id")
    .single();

  if (pErr) {
    console.error("[Pack] Puzzle insert error:", pErr);
  } else {
    results.puzzle = insertedPuzzle;
    console.log(`[Pack] Puzzle inserted: ${insertedPuzzle.id} (type: ${puzzleData.interaction_type})`);
  }

  // ─── Insert Lesson (A1: wrapped in try/catch — pack can survive without lesson) ──
  let insertedLesson: any = null;
  try {
    const { data: lessonRow, error: lErr } = await supabase
      .from("daily_lessons")
      .insert({
        theme: theme,
        title: lessonData.title || "Lesson of the Day",
        title_fr: fr["lesson_title"] || "",
        title_it: it["lesson_title"] || "",
        title_es: es["lesson_title"] || "",
        content: lessonData.content || "",
        content_fr: fr["lesson_content"] || "",
        content_it: it["lesson_content"] || "",
        content_es: es["lesson_content"] || "",
        key_takeaway: lessonData.key_takeaway || "",
        key_takeaway_fr: fr["lesson_key_takeaway"] || "",
        key_takeaway_it: it["lesson_key_takeaway"] || "",
        key_takeaway_es: es["lesson_key_takeaway"] || "",
        puzzle_id: insertedPuzzle?.id || null,
        status: "active",
      })
      .select("id")
      .single();

    if (lErr) {
      console.error("[Pack] Lesson insert error:", lErr);
    } else {
      insertedLesson = lessonRow;
      results.lesson = insertedLesson;
      console.log(`[Pack] Lesson inserted: ${insertedLesson.id}`);
    }
  } catch (lessonErr) {
    console.error("[Pack] Lesson generation/insert failed (non-blocking):", lessonErr);
  }

  // ─── Insert daily_packs record ─────────────────────────────────────────
  const questionIds = results.questions.map((q: any) => q.id).filter(Boolean);
  try {
    const { data: packRow, error: packErr } = await supabase
      .from("daily_packs")
      .insert({
        theme: theme,
        difficulty: difficulty,
        question_ids: questionIds,
        puzzle_id: results.puzzle?.id || null,
        lesson_id: insertedLesson?.id || null,
        status: "ready",
      })
      .select("id")
      .single();

    if (packErr) {
      console.error("[Pack] daily_packs insert error:", packErr);
    } else {
      results.pack_id = packRow.id;
      console.log(`[Pack] daily_packs record created: ${packRow.id}`);
    }
  } catch (packInsertErr) {
    console.error("[Pack] daily_packs insert failed:", packInsertErr);
  }

  return results;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const theme = body.theme || "fundraising";
    const count = Math.min(body.count || 1, 10);
    const difficulty = body.difficulty || "medium";

    const startTime = Date.now();
    const allResults = [];
    let totalApiCalls = 0;
    for (let i = 0; i < count; i++) {
      console.log(`[Pack] Generating pack ${i + 1}/${count} for theme: ${theme}`);
      const result = await generateOnePack(theme, difficulty);
      allResults.push(result);
      totalApiCalls += 5; // 5 Claude calls per pack (QCM, puzzle, lesson, translations, context_data translations)
    }
    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        packs: allResults.length,
        theme,
        difficulty,
        results: allResults,
        stats: {
          duration_ms: durationMs,
          duration_s: Math.round(durationMs / 1000),
          api_calls: totalApiCalls,
          estimated_cost_usd: +(totalApiCalls * 0.015).toFixed(3),
        },
      }),
      { headers: corsHeaders() }
    );
  } catch (err) {
    console.error("generate-daily-pack error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders() }
    );
  }
});
