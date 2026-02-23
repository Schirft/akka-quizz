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
User sees a data document. One element is wrong/suspicious. User taps the problematic element.
interaction_type: "tap_to_spot"

This mechanic has 10 VISUAL TYPES. You MUST include "visual_type" in context_data. Choose the best visual_type for the theme:

VISUAL TYPE "cap_table": Shareholder table where percentages don't add up (>100% or <100%)
VISUAL TYPE "bar_chart": MRR/revenue bar chart where one month contradicts a growth claim
VISUAL TYPE "term_sheet": Legal clauses where one clause gives hidden control/power
VISUAL TYPE "metric_cards": Pitch deck metrics where one is a vanity metric hiding bad fundamentals
VISUAL TYPE "pnl_table": P&L where one expense is one-time cost disguised as recurring
VISUAL TYPE "cohort_grid": Retention cohort table showing degrading product quality over time
VISUAL TYPE "funding_timeline": Fundraising rounds where one is a hidden down round
VISUAL TYPE "unit_economics": Per-unit P&L where one cost is misclassified (COGS vs Opex)
VISUAL TYPE "investor_email": CEO update email where bad news is buried in positive language
VISUAL TYPE "comp_table": Comparable companies table with a cherry-picked outlier inflating the median

THEME → BEST VISUAL TYPES:
- Fundraising: funding_timeline, comp_table, investor_email
- Cap Tables: cap_table, cohort_grid
- Term Sheets: term_sheet, investor_email
- Unit Economics: unit_economics, pnl_table
- Revenue & Growth: bar_chart, cohort_grid, metric_cards
- Burn Analysis: pnl_table, bar_chart, unit_economics
- Market & Comps: comp_table, metric_cards
- Pitch Decks & Reporting: metric_cards, investor_email, bar_chart

CONTEXT_DATA MUST ALWAYS INCLUDE:
- "visual_type": one of the 10 types above
- "question_en": the question text
- "rows": array of tappable elements, each with "id", "label", "value"

ADDITIONAL FIELDS BY VISUAL TYPE:
- bar_chart: add "claim" (the founder's claim that's wrong)
- term_sheet: add "document_title"
- pnl_table: add "revenue" (number), "claimed_runway" (string)
- cohort_grid: add "columns" (array of period labels), rows have "values" (array of numbers/null) instead of single "value"
- funding_timeline: rows also have "date", "amount", "valuation" fields
- unit_economics: rows have "section" ("cogs" or "opex"), add "revenue_per_unit" and "claimed_gross_margin"
- investor_email: add "email_from", "email_subject", "email_date". Rows are paragraphs.
- comp_table: add "columns" (array), rows have "values" (array) instead of single "value". Add "median_label".
- metric_cards: rows also have "trend" and "icon" fields
- cap_table: rows also have "shares" field

CRITICAL RULES FOR tap_to_spot:
- "answer" must match the "id" of ONE row
- Every row MUST have "id" and "label"
- For cap_table, bar_chart, term_sheet, metric_cards, pnl_table: rows also have "value"
- For cohort_grid, comp_table: rows have "values" (array) instead of "value"
- For funding_timeline: rows have "value" (display string) plus "date", "amount", "valuation"
- The flaw must be SUBTLE but DETECTABLE by a careful reader — not too obvious, not impossible

MECHANIC 2: "A/B COMPARISON" (pick the better deal)
User sees two deals/charts/scenarios side by side. User picks A or B. Then sees detailed breakdown of why.
interaction_type: "ab_choice"
context_data format: { "option_a": { "title": "...", "metrics": {...} }, "option_b": { "title": "...", "metrics": {...} } }
answer: "a" or "b"

MECHANIC 3: "FILL THE GAP" (choose the missing number)
A cap table, P&L, or financial table with ONE number replaced by "?". User picks from 3-4 options.
interaction_type: "fill_gap"
context_data format: { "rows": [...], "missing_field": {"row_id": "...", "field": "value"}, "options": [12, 15, 18, 22], "correct_option": 15 }
answer: the correct number (MUST match correct_option exactly)

MECHANIC 4: "MATCH THE CHART" (match description to visual)
2-3 mini charts + 1 text description. User matches the description to the right chart.
interaction_type: "match_chart"
context_data format: { "charts": [{"id": "a", "type": "line", "data": [...], "label": "Chart A"}, ...], "description": "..." }
answer: "a" (the id of the matching chart)

MECHANIC 5: "BEFORE/AFTER" (find the inconsistency)
Two versions of the same document (before/after a round). One number changed incorrectly.
interaction_type: "before_after"
context_data format: { "before": { "title": "Pre-Series A", "rows": [...] }, "after": { "title": "Post-Series A", "rows": [...] } }
answer: the "id" of the inconsistent element in "after"

MECHANIC 6: "CRASH POINT" (tap the danger moment on a timeline)
A cash balance curve or runway chart over 18-24 months. User taps the month where danger occurs.
interaction_type: "crash_point"
context_data format: { "chart_type": "cash_balance", "data": [{"month": "Jan 2025", "cash": 2400000}, ...] }
answer: "Sep 2025" (a specific month string matching one of the data entries)

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

═══════════════════════════════════════════════════════
MANDATORY FIELD NAMING RULES — FOLLOW EXACTLY:
═══════════════════════════════════════════════════════

1. EVERY row in "rows" arrays MUST have these EXACT fields: "id" (string), "label" (string), "value" (string or number).
   Do NOT use "percentage", "shares", "amount", "terms" etc. ALWAYS use "value".
   Exception: For visual_type "cohort_grid" or "comp_table", use "values" (array) instead of "value".
   Exception: For visual_type "cap_table", ALSO include "shares" alongside "value".
   Exception: For visual_type "metric_cards", ALSO include "trend" and "icon".
   Exception: For visual_type "funding_timeline", ALSO include "date", "amount", "valuation".
   Exception: For visual_type "unit_economics" or "pnl_table", ALSO include "section".

2. For ab_choice: You MUST provide BOTH "option_a" AND "option_b". Missing either one is a critical error.
   Each option MUST have: "title" (string), "metrics" (object with key-value pairs).
   Do NOT use "terms" or "data" instead of "metrics". ALWAYS use "metrics".

3. For fill_gap: "missing_field.field" MUST be "value". The missing row's "value" should be null.
   "options" must be an array of 3-4 numbers. "correct_option" must be one of those numbers.

4. For before_after: Both "before" and "after" MUST exist. Each MUST have "title" and "rows" array.
   Each row MUST use "value" for the display field.

5. For crash_point: "data" MUST be an array of objects with "month" and "cash" fields.

6. ALWAYS include "question_en" at the top level of context_data.

7. The "answer" field MUST match an actual "id" from the rows (for tap_to_spot, before_after)
   or "a"/"b" (for ab_choice) or a number in options (for fill_gap) or a month string (for crash_point)
   or a chart id (for match_chart).

CONCRETE EXAMPLES FOR EACH VISUAL TYPE:

cap_table:
{ "visual_type": "cap_table", "question_en": "This cap table totals 115%. Which shareholder row is wrong?", "rows": [{"id":"founders","label":"Founders","shares":4500000,"value":"45%"},{"id":"seed","label":"Seed Investors","shares":2500000,"value":"25%"},{"id":"esop","label":"ESOP","shares":1500000,"value":"15%"},{"id":"advisors","label":"Advisors","shares":3000000,"value":"30%"}] }
answer: "advisors"

bar_chart:
{ "visual_type": "bar_chart", "question_en": "The founder claims 15% constant MoM growth. Which month breaks the pattern?", "claim": "15% constant MoM growth since January", "rows": [{"id":"jan","label":"Jan","value":120000},{"id":"feb","label":"Feb","value":138000},{"id":"mar","label":"Mar","value":158700},{"id":"apr","label":"Apr","value":182505},{"id":"may","label":"May","value":209881},{"id":"jun","label":"Jun","value":241363},{"id":"jul","label":"Jul","value":277567},{"id":"aug","label":"Aug","value":319202},{"id":"sep","label":"Sep","value":285000},{"id":"oct","label":"Oct","value":367082}] }
answer: "sep"

term_sheet:
{ "visual_type": "term_sheet", "question_en": "Which clause gives the VC hidden board control?", "document_title": "Series A Term Sheet — TechCo Inc.", "rows": [{"id":"clause1","label":"§1 — Pre-money Valuation","value":"€12M pre-money valuation"},{"id":"clause2","label":"§2 — Investment Amount","value":"€3M for 20% equity"},{"id":"clause3","label":"§3 — Board Composition","value":"5 seats: 2 founders, 2 VC, 1 independent (nominated by lead investor)"},{"id":"clause4","label":"§4 — Liquidation Preference","value":"1x non-participating preferred"}] }
answer: "clause3"

metric_cards:
{ "visual_type": "metric_cards", "question_en": "Which metric is a vanity metric?", "rows": [{"id":"downloads","label":"Total Downloads","value":"340K","trend":"+45%","icon":"📱"},{"id":"activation","label":"Activation Rate","value":"3.5%","trend":"-2%","icon":"⚡"},{"id":"d30","label":"D30 Retention","value":"8%","trend":"-5%","icon":"📉"},{"id":"revenue","label":"MRR","value":"€12K","trend":"+18%","icon":"💰"}] }
answer: "downloads"

pnl_table:
{ "visual_type": "pnl_table", "question_en": "One expense is a one-time contract disguised as recurring. Which one?", "revenue": 120000, "claimed_runway": "18 months", "rows": [{"id":"engineering","label":"Engineering","value":"€85K/mo","section":"expense"},{"id":"sales","label":"Sales & Marketing","value":"€45K/mo","section":"expense"},{"id":"professional","label":"Professional Services","value":"€65K/mo","section":"expense"},{"id":"infra","label":"Infrastructure","value":"€15K/mo","section":"expense"}] }
answer: "professional"

cohort_grid:
{ "visual_type": "cohort_grid", "question_en": "Which cohort shows the worst M3 retention?", "columns": ["M0","M1","M3","M6","M12"], "rows": [{"id":"q1","label":"Q1 2024","values":[100,85,72,58,41]},{"id":"q2","label":"Q2 2024","values":[100,82,65,48,null]},{"id":"q3","label":"Q3 2024","values":[100,78,55,null,null]},{"id":"q4","label":"Q4 2024","values":[100,71,47,null,null]}] }
answer: "q4"

funding_timeline:
{ "visual_type": "funding_timeline", "question_en": "One round is a hidden down round. Which one?", "rows": [{"id":"seed","label":"Seed","value":"€2M @ €8M pre","date":"Mar 2021","amount":2000000,"valuation":8000000},{"id":"series_a","label":"Series A","value":"€8M @ €30M pre","date":"Nov 2022","amount":8000000,"valuation":30000000},{"id":"bridge","label":"Bridge","value":"€5M @ €50M pre","date":"Jan 2024","amount":5000000,"valuation":50000000},{"id":"series_c","label":"Series C","value":"€30M @ €100M pre","date":"Sep 2024","amount":30000000,"valuation":100000000}] }
answer: "bridge"

unit_economics:
{ "visual_type": "unit_economics", "question_en": "One cost is misclassified. Which one?", "revenue_per_unit": 49.90, "claimed_gross_margin": "71%", "rows": [{"id":"food_cost","label":"Food Cost","value":"€12.50","section":"cogs"},{"id":"packaging","label":"Packaging","value":"€2.40","section":"cogs"},{"id":"fulfillment","label":"Fulfillment & Delivery","value":"€14.50","section":"opex"},{"id":"marketing","label":"Marketing","value":"€8.00","section":"opex"},{"id":"support","label":"Customer Support","value":"€3.20","section":"opex"}] }
answer: "fulfillment"

investor_email:
{ "visual_type": "investor_email", "question_en": "Which paragraph buries bad news?", "email_from": "Marc Dubois, CEO", "email_subject": "Q3 Update — Strong Quarter! 🚀", "email_date": "October 15, 2024", "rows": [{"id":"p1","label":"Revenue Update","value":"Thrilled to share we hit €420K MRR, up 22% from Q2."},{"id":"p2","label":"Team Update","value":"We onboarded 12 engineers and parted ways with our VP of Sales to realign GTM strategy."},{"id":"p3","label":"Product","value":"Shipped v2.3 with AI recommendations. 40% conversion improvement."},{"id":"p4","label":"Fundraising","value":"Series B process kicks off Q1 2025. Runway to August."}] }
answer: "p2"

comp_table:
{ "visual_type": "comp_table", "question_en": "One comparable inflates the median. Which one?", "columns": ["Company","Stage","ARR","Growth","Multiple","Valuation"], "rows": [{"id":"comp1","label":"DataFlow","values":["DataFlow","Series A","€3M","85%","18x","€54M"]},{"id":"comp2","label":"CloudPeak","values":["CloudPeak","Series B","€12M","65%","14x","€168M"]},{"id":"comp3","label":"MegaScale","values":["MegaScale","Pre-IPO","€180M","32%","22x","€3.96B"]},{"id":"comp4","label":"NexGen AI","values":["NexGen AI","Series A","€5M","110%","20x","€100M"]}], "median_label": "Median Multiple: 18x (excl. outlier: 16x)" }
answer: "comp3"

ab_choice:
{ "question_en": "Which deal gives better terms?", "option_a": {"title":"Deal A","metrics":{"valuation":"€5M","dilution":"20%"},"description":"Early-stage SaaS"}, "option_b": {"title":"Deal B","metrics":{"valuation":"€8M","dilution":"12%"},"description":"Growth-stage fintech"} }

fill_gap:
{ "question_en": "What is the missing pre-money valuation?", "rows": [{"id":"r1","label":"Investment","value":"€1M"},{"id":"r2","label":"Pre-money","value":null},{"id":"r3","label":"Post-money","value":"€6M"}], "missing_field": {"row_id":"r2","field":"value"}, "options": [3,4,5,6], "correct_option": 5 }

before_after:
{ "question_en": "Which row changed incorrectly?", "before": {"title":"Pre-Series A","rows":[{"id":"b1","label":"Founders","value":"80%"},{"id":"b2","label":"ESOP","value":"10%"},{"id":"b3","label":"Angels","value":"10%"}]}, "after": {"title":"Post-Series A","rows":[{"id":"a1","label":"Founders","value":"60%"},{"id":"a2","label":"ESOP","value":"15%"},{"id":"a3","label":"Angels","value":"10%"},{"id":"a4","label":"Series A","value":"20%"}]} }

crash_point:
{ "question_en": "In which month does runway drop below 3 months?", "chart_type": "cash_balance", "data": [{"month":"Jan","cash":2400000},{"month":"Feb","cash":2200000},{"month":"Mar","cash":2000000}] }`;
}

// ─── Post-generation validation ─────────────────────────────────────────────

interface ValidationError {
  field: string;
  message: string;
}

function validatePuzzleData(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    errors.push({ field: "root", message: "Puzzle data is not an object" });
    return errors;
  }

  // Basic required fields
  if (!data.interaction_type) errors.push({ field: "interaction_type", message: "Missing interaction_type" });
  if (!data.title) errors.push({ field: "title", message: "Missing title" });
  if (data.answer === undefined || data.answer === null || data.answer === "") errors.push({ field: "answer", message: "Missing answer" });
  if (!data.explanation) errors.push({ field: "explanation", message: "Missing explanation" });
  if (!data.context_data || typeof data.context_data !== "object") {
    errors.push({ field: "context_data", message: "Missing or invalid context_data" });
    return errors;
  }

  const ctx = data.context_data;
  const type = data.interaction_type;

  // Must have question
  if (!ctx.question_en && !ctx.question) {
    errors.push({ field: "context_data.question_en", message: "Missing question_en in context_data" });
  }

  // Type-specific validation
  switch (type) {
    case "tap_to_spot": {
      const validVisualTypes = ["cap_table","bar_chart","term_sheet","metric_cards","pnl_table","cohort_grid","funding_timeline","unit_economics","investor_email","comp_table"];
      if (ctx.visual_type && !validVisualTypes.includes(ctx.visual_type)) {
        errors.push({ field: "context_data.visual_type", message: `Invalid visual_type: ${ctx.visual_type}. Valid: ${validVisualTypes.join(", ")}` });
      }
      const rows = ctx.rows || ctx.clauses || ctx.items;
      if (!rows || !Array.isArray(rows) || rows.length < 2) {
        errors.push({ field: "context_data.rows", message: "tap_to_spot needs rows/clauses/items array with ≥2 items" });
      } else {
        const ids = rows.map((r: any) => r.id).filter(Boolean);
        if (ids.length !== rows.length) errors.push({ field: "context_data.rows[].id", message: "Every row must have a unique 'id'" });
        if (!rows.every((r: any) => r.label || r.text || r.clause || r.name)) {
          errors.push({ field: "context_data.rows[].label", message: "Every row needs a label/text/clause/name" });
        }
        if (!ids.includes(String(data.answer))) {
          errors.push({ field: "answer", message: `Answer "${data.answer}" does not match any row id. Valid ids: ${ids.join(", ")}` });
        }
      }
      break;
    }
    case "ab_choice": {
      if (!ctx.option_a || typeof ctx.option_a !== "object") {
        errors.push({ field: "context_data.option_a", message: "MISSING option_a — this is REQUIRED" });
      } else if (!ctx.option_a.title) {
        errors.push({ field: "context_data.option_a.title", message: "option_a needs a title" });
      }
      if (!ctx.option_b || typeof ctx.option_b !== "object") {
        errors.push({ field: "context_data.option_b", message: "MISSING option_b — this is REQUIRED" });
      } else if (!ctx.option_b.title) {
        errors.push({ field: "context_data.option_b.title", message: "option_b needs a title" });
      }
      if (data.answer !== "a" && data.answer !== "b") {
        errors.push({ field: "answer", message: `Answer must be "a" or "b", got "${data.answer}"` });
      }
      break;
    }
    case "fill_gap": {
      if (!ctx.rows || !Array.isArray(ctx.rows) || ctx.rows.length < 2) {
        errors.push({ field: "context_data.rows", message: "fill_gap needs rows array with ≥2 items" });
      }
      if (!ctx.missing_field || !ctx.missing_field.row_id) {
        errors.push({ field: "context_data.missing_field", message: "fill_gap needs missing_field with row_id" });
      }
      if (!ctx.options || !Array.isArray(ctx.options) || ctx.options.length < 2) {
        errors.push({ field: "context_data.options", message: "fill_gap needs options array with ≥2 choices" });
      }
      if (ctx.correct_option === undefined) {
        errors.push({ field: "context_data.correct_option", message: "fill_gap needs correct_option" });
      }
      break;
    }
    case "match_chart": {
      if (!ctx.charts || !Array.isArray(ctx.charts) || ctx.charts.length < 2) {
        errors.push({ field: "context_data.charts", message: "match_chart needs charts array with ≥2 items" });
      } else {
        const chartIds = ctx.charts.map((c: any) => c.id).filter(Boolean);
        if (!chartIds.includes(String(data.answer))) {
          errors.push({ field: "answer", message: `Answer "${data.answer}" not in chart ids: ${chartIds.join(", ")}` });
        }
      }
      if (!ctx.description) {
        errors.push({ field: "context_data.description", message: "match_chart needs a description" });
      }
      break;
    }
    case "before_after": {
      if (!ctx.before || typeof ctx.before !== "object") {
        errors.push({ field: "context_data.before", message: "before_after needs 'before' section" });
      } else if (!ctx.before.rows || !Array.isArray(ctx.before.rows) || ctx.before.rows.length < 2) {
        errors.push({ field: "context_data.before.rows", message: "before section needs rows array" });
      }
      if (!ctx.after || typeof ctx.after !== "object") {
        errors.push({ field: "context_data.after", message: "before_after needs 'after' section" });
      } else if (!ctx.after.rows || !Array.isArray(ctx.after.rows) || ctx.after.rows.length < 2) {
        errors.push({ field: "context_data.after.rows", message: "after section needs rows array" });
      } else {
        const afterIds = ctx.after.rows.map((r: any) => r.id).filter(Boolean);
        if (!afterIds.includes(String(data.answer))) {
          errors.push({ field: "answer", message: `Answer "${data.answer}" not in after row ids: ${afterIds.join(", ")}` });
        }
      }
      break;
    }
    case "crash_point": {
      if (!ctx.data || !Array.isArray(ctx.data) || ctx.data.length < 3) {
        errors.push({ field: "context_data.data", message: "crash_point needs data array with ≥3 months" });
      } else {
        const months = ctx.data.map((d: any) => d.month).filter(Boolean);
        if (!months.includes(String(data.answer))) {
          errors.push({ field: "answer", message: `Answer "${data.answer}" not in month data: ${months.join(", ")}` });
        }
      }
      break;
    }
    default:
      errors.push({ field: "interaction_type", message: `Unknown interaction_type: ${type}` });
  }

  return errors;
}

function buildFixPrompt(originalData: any, validationErrors: ValidationError[]): string {
  const errorList = validationErrors.map((e) => `- ${e.field}: ${e.message}`).join("\n");
  return `The following puzzle JSON has validation errors. Fix ALL of them and return the corrected COMPLETE puzzle JSON.

VALIDATION ERRORS:
${errorList}

ORIGINAL PUZZLE (fix this):
${JSON.stringify(originalData, null, 2)}

RULES:
- Return the COMPLETE fixed puzzle JSON (not just the changed fields)
- Fix ALL validation errors listed above
- Keep the same theme and concept, just fix the structural issues
- MANDATORY: For ab_choice, BOTH option_a AND option_b must exist with "title" and "metrics"
- MANDATORY: All rows must use "value" as the display field name
- MANDATORY: "answer" must match an actual id/option in the context_data
- Return ONLY valid JSON, no markdown or explanation`;
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

    // ─── STEP 1: Generate puzzle with validation ───────────────────────
    console.log(`[PackPuzzle] Generating puzzle for ${theme}...`);
    let puzzleData: any;
    let validationAttempts = 0;
    const MAX_VALIDATION_ATTEMPTS = 2;

    // Initial generation
    const puzzleResp = await callClaudeWithRetry(buildPuzzlePrompt(theme, difficulty), 4096);
    puzzleData = extractJSON(puzzleResp);
    apiCalls++;

    // Validate and retry if needed
    let validationErrors = validatePuzzleData(puzzleData);
    while (validationErrors.length > 0 && validationAttempts < MAX_VALIDATION_ATTEMPTS) {
      validationAttempts++;
      console.log(`[PackPuzzle] Validation failed (${validationErrors.length} errors), attempt ${validationAttempts}/${MAX_VALIDATION_ATTEMPTS} to fix...`);
      validationErrors.forEach((e) => console.log(`  - ${e.field}: ${e.message}`));

      try {
        const fixResp = await callClaudeWithRetry(buildFixPrompt(puzzleData, validationErrors), 4096);
        puzzleData = extractJSON(fixResp);
        apiCalls++;
        validationErrors = validatePuzzleData(puzzleData);
      } catch (fixErr) {
        console.error(`[PackPuzzle] Fix attempt ${validationAttempts} failed:`, (fixErr as Error).message);
        break;
      }
    }

    if (validationErrors.length > 0) {
      console.warn(`[PackPuzzle] WARNING: ${validationErrors.length} validation errors remain after ${validationAttempts} fix attempts:`);
      validationErrors.forEach((e) => console.warn(`  - ${e.field}: ${e.message}`));
      // Continue anyway — the board components have fallback rendering
    } else {
      console.log(`[PackPuzzle] Puzzle validated successfully${validationAttempts > 0 ? ` (after ${validationAttempts} fix(es))` : ""}`);
    }

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
        validation: {
          passed: validationErrors.length === 0,
          fix_attempts: validationAttempts,
          remaining_errors: validationErrors.length,
        },
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
