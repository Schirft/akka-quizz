/**
 * Edge Function: generate-pack-questions
 *
 * Generates 3 QCM questions (easy/medium/hard) for a pack,
 * then auto-translates to FR/IT/ES.
 * Inserts them into the "questions" table and returns their IDs.
 *
 * Body: { theme, difficulty }
 * Returns: { success, question_ids: string[] }
 *
 * Deployment:
 *   supabase functions deploy generate-pack-questions --no-verify-jwt
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

function buildQCMPrompt(theme: string, difficulty: string): string {
  return `You are creating quiz questions for AKKA, a European startup investment club.

Theme: ${theme}
Difficulty: ${difficulty}

Create 3 multiple-choice questions about ${theme} in startup investing.
Our audience ranges from complete beginners to experienced investors.

DIFFICULTY GUIDELINES (follow strictly):
- Question 1: EASY — Accessible to anyone with zero finance knowledge.
  Use simple everyday language. No jargon, no acronyms.
  Think: "What does X mean?" or "Which famous company did Y?"
  Example level: "What does IPO stand for?" or "Who founded Tesla?"

- Question 2: MEDIUM — Requires understanding a concept but no calculation.
  Can use common investing terms (explain if specialized).
  Think: "Why is X important?" or "What happens when Y?"
  Example level: "Why do VCs prefer convertible notes for early-stage deals?"

- Question 3: HARD — Scenario-based, analytical, combines multiple concepts.
  Can use technical terms. Requires reasoning, not just recall.
  Think: "Given this situation, what's the best strategy?"
  Example level: "A startup has 18 months runway but 40% monthly growth. Should they raise now or wait?"

CRITICAL ANSWER LENGTH RULE:
Each answer option MUST be SHORT — maximum 20 words, ideally under 10 words.
Answers are displayed on mobile phones in small buttons.
NEVER write long sentence answers. Use short phrases, names, numbers, or brief concepts.
BAD: "The process by which a company offers its shares to the public for the first time on a stock exchange"
GOOD: "Initial Public Offering (IPO)"
BAD: "They provide both capital and strategic guidance to help startups grow and succeed"
GOOD: "Capital + strategic guidance"

For EACH question provide:
- question: the question text (clear, concise, one sentence)
- answers: array of 4 possible answers (MAXIMUM 20 words each, ideally under 10)
- correct_answer_index: 0-3
- explanation: 2-3 simple sentences explaining the answer (max 50-80 words, beginner-friendly, no jargon)
- category: subcategory within the theme

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "...",
      "answers": ["Short A", "Short B", "Short C", "Short D"],
      "correct_answer_index": 0,
      "explanation": "...",
      "category": "..."
    }
  ]
}`;
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

    // ─── STEP 1: Generate 3 QCM ─────────────────────────────────────────
    console.log(`[PackQ] Generating 3 QCM for ${theme}...`);
    const qcmResp = await callClaudeWithRetry(buildQCMPrompt(theme, difficulty), 4096);
    const qcmData = extractJSON(qcmResp);
    const questions = qcmData.questions || [];
    apiCalls++;

    // Insert Questions (English only first)
    const difficultyLevels = ["easy", "medium", "hard"];
    const questionIds: string[] = [];
    const insertedQuestions: Array<{ id: string; question: string; answers: string[]; explanation: string }> = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      const { data: insertedQ, error: qErr } = await supabase
        .from("questions")
        .insert({
          question_en: q.question,
          answers_en: q.answers,
          correct_answer_index: (q.correct_answer_index || 0) + 1, // Convert 0-based to 1-based
          explanation_en: q.explanation || "",
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
        console.error(`[PackQ] Question insert error:`, qErr);
      } else {
        questionIds.push(insertedQ.id);
        insertedQuestions.push({
          id: insertedQ.id,
          question: q.question,
          answers: q.answers || [],
          explanation: q.explanation || "",
        });
      }
    }

    // ─── STEP 2: Translate all questions to FR/IT/ES ────────────────────
    let questionsTranslated = 0;
    for (let i = 0; i < insertedQuestions.length; i++) {
      const q = insertedQuestions[i];
      try {
        console.log(`[PackQ] Translating question ${i + 1}/${insertedQuestions.length}...`);

        const qFields: Record<string, string> = {
          question: q.question,
          explanation: q.explanation,
        };
        q.answers.forEach((a: string, j: number) => {
          qFields[`answer_${j}`] = a;
        });

        const prompt = buildTranslationPrompt(qFields);
        const resp = await callClaudeWithRetry(prompt, 8192);
        const parsed = extractJSON(resp);
        apiCalls++;

        const t = { fr: parsed.fr || {}, it: parsed.it || {}, es: parsed.es || {} };

        const { error: uErr } = await supabase
          .from("questions")
          .update({
            question_fr: t.fr["question"] || "",
            question_it: t.it["question"] || "",
            question_es: t.es["question"] || "",
            answers_fr: q.answers.map((_: string, j: number) => t.fr[`answer_${j}`] || q.answers[j]),
            answers_it: q.answers.map((_: string, j: number) => t.it[`answer_${j}`] || q.answers[j]),
            answers_es: q.answers.map((_: string, j: number) => t.es[`answer_${j}`] || q.answers[j]),
            explanation_fr: t.fr["explanation"] || "",
            explanation_it: t.it["explanation"] || "",
            explanation_es: t.es["explanation"] || "",
          })
          .eq("id", q.id);

        if (uErr) {
          console.error(`[PackQ] Question ${q.id} translation update error:`, uErr);
        } else {
          questionsTranslated++;
        }
      } catch (tErr) {
        // Translation failure is non-fatal — question still exists in English
        console.error(`[PackQ] Question ${i + 1} translation failed (non-fatal):`, (tErr as Error).message);
      }
    }

    console.log(`[PackQ] Translated ${questionsTranslated}/${insertedQuestions.length} questions`);

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        question_ids: questionIds,
        translated: questionsTranslated,
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
    console.error("generate-pack-questions error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders() }
    );
  }
});
