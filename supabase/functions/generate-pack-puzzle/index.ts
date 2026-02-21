/**
 * Edge Function: generate-pack-puzzle
 *
 * Generates 1 puzzle "The Catch" for a pack, then auto-translates to FR/IT/ES.
 * Inserts it into the "puzzles" table and returns its ID.
 *
 * Body: { theme, difficulty }
 * Returns: { success, puzzle_id, puzzle_data: { title, answer, explanation } }
 *
 * Deployment:
 *   supabase functions deploy generate-pack-puzzle --no-verify-jwt
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

// ─── Translation helpers (from translate-pack) ────────────────────────────────

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

CRITICAL RULES FOR context_data:
- context_data MUST be valid JSON that a React frontend can render directly
- Every clickable/interactive element MUST have a unique "id" field
- The puzzle must be solvable — there is exactly ONE correct answer
- The explanation should teach a real investment concept
- Vary the mechanics — don't always use tap_to_spot
- ALWAYS include a "question" or "question_en" field inside context_data

CONCRETE EXAMPLES OF CORRECT context_data per interaction_type:

tap_to_spot:
{ "question_en": "Which clause is unusual for a seed round?", "rows": [{"id":"row1","label":"Pre-money","value":"€4M"},{"id":"row2","label":"Liquidation Pref","value":"3x"},{"id":"row3","label":"Pro-rata","value":"Yes"}] }

ab_choice:
{ "question_en": "Which deal gives better terms for the investor?", "option_a": {"title":"Deal A","metrics":{"valuation":"€5M","dilution":"20%"},"description":"Early-stage SaaS"}, "option_b": {"title":"Deal B","metrics":{"valuation":"€8M","dilution":"12%"},"description":"Growth-stage fintech"} }

fill_gap:
{ "question_en": "What is the missing pre-money valuation?", "rows": [{"id":"r1","label":"Investment","value":"€1M"},{"id":"r2","label":"Pre-money","value":null},{"id":"r3","label":"Post-money","value":"€6M"}], "missing_field": {"row_id":"r2","field":"value"}, "options": [3,4,5,6], "correct_option": 5 }

match_chart:
{ "question_en": "Which chart shows a SaaS company with strong net retention?", "charts": [{"id":"a","label":"Chart A","type":"line","data":[100,110,125,140]},{"id":"b","label":"Chart B","type":"line","data":[100,95,88,80]}], "description": "Revenue grows even without new customers" }

before_after:
{ "question_en": "Which row changed incorrectly after the Series A?", "before": {"title":"Pre-Series A","rows":[{"id":"b1","label":"Founders","value":"80%"},{"id":"b2","label":"ESOP","value":"10%"},{"id":"b3","label":"Angels","value":"10%"}]}, "after": {"title":"Post-Series A","rows":[{"id":"a1","label":"Founders","value":"60%"},{"id":"a2","label":"ESOP","value":"15%"},{"id":"a3","label":"Angels","value":"10%"},{"id":"a4","label":"Series A","value":"20%"}]} }

crash_point:
{ "question_en": "In which month does runway drop below 3 months?", "chart_type": "cash_balance", "data": [{"month":"Jan","cash":2400000},{"month":"Feb","cash":2200000},{"month":"Mar","cash":2000000}] }`;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const theme = body.theme || "fundraising";
    const difficulty = body.difficulty || "medium";

    const startTime = Date.now();
    let apiCalls = 0;

    // ─── STEP 1: Generate puzzle ────────────────────────────────────────
    console.log(`[PackPuzzle] Generating puzzle for ${theme}...`);
    const puzzleResp = await callClaudeWithRetry(buildPuzzlePrompt(theme, difficulty), 4096);
    const puzzleData = extractJSON(puzzleResp);
    apiCalls++;

    // Normalize answer to string (DB column is text, not jsonb)
    const rawAnswer = puzzleData.answer;
    const answerStr = typeof rawAnswer === "object"
      ? JSON.stringify(rawAnswer)
      : String(rawAnswer ?? "");

    // Insert Puzzle (English only first)
    const { data: insertedPuzzle, error: pErr } = await supabase
      .from("puzzles")
      .insert({
        theme: theme,
        difficulty: difficulty,
        puzzle_type: puzzleData.puzzle_type || theme.toLowerCase().replace(/ /g, "_"),
        interaction_type: puzzleData.interaction_type || "tap_to_spot",
        title: puzzleData.title || "The Catch",
        subtitle: puzzleData.subtitle || "",
        context_data: puzzleData.context_data || {},
        hint: puzzleData.hint || "",
        answer: answerStr,
        explanation: puzzleData.explanation || "",
        timer_seconds: puzzleData.timer_seconds || 90,
        status: "active",
      })
      .select("id")
      .single();

    if (pErr) {
      console.error("[PackPuzzle] Puzzle insert error:", pErr);
      throw new Error(`Puzzle insert failed: ${pErr.message}`);
    }

    // ─── STEP 2: Translate to FR/IT/ES ──────────────────────────────────
    let translationSuccess = false;
    try {
      console.log(`[PackPuzzle] Translating puzzle to FR/IT/ES...`);

      // Collect all translatable fields
      const pFields: Record<string, string> = {
        title: puzzleData.title || "",
        hint: puzzleData.hint || "",
        explanation: puzzleData.explanation || "",
      };

      // Extract context_data translatable strings
      const ctxStrings = extractContextDataStrings(puzzleData.context_data || {});
      for (const [key, val] of Object.entries(ctxStrings)) {
        pFields[key] = val;
      }

      console.log(`[PackPuzzle] Translating ${Object.keys(pFields).length} fields...`);
      const prompt = buildTranslationPrompt(pFields);
      const resp = await callClaudeWithRetry(prompt, 8192);
      const parsed = extractJSON(resp);
      apiCalls++;

      const t = { fr: parsed.fr || {}, it: parsed.it || {}, es: parsed.es || {} };

      // Rebuild translated context_data
      const contextDataFr = rebuildContextData(puzzleData.context_data || {}, t.fr);
      const contextDataIt = rebuildContextData(puzzleData.context_data || {}, t.it);
      const contextDataEs = rebuildContextData(puzzleData.context_data || {}, t.es);

      // Update puzzle with translations
      const { error: uErr } = await supabase
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
        .eq("id", insertedPuzzle.id);

      if (uErr) {
        console.error("[PackPuzzle] Translation update error:", uErr);
      } else {
        translationSuccess = true;
        console.log("[PackPuzzle] Translations saved successfully");
      }
    } catch (tErr) {
      // Translation failure is non-fatal — puzzle still exists in English
      console.error("[PackPuzzle] Translation failed (non-fatal):", (tErr as Error).message);
    }

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        puzzle_id: insertedPuzzle.id,
        puzzle_data: {
          title: puzzleData.title || "The Catch",
          answer: answerStr,
          explanation: puzzleData.explanation || "",
          context_data: puzzleData.context_data || {},
        },
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
    console.error("generate-pack-puzzle error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders() }
    );
  }
});
