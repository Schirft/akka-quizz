/**
 * Edge Function: generate-pack-questions
 *
 * Generates 3 QCM questions (easy/medium/hard) for a pack.
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

    // Generate 3 QCM
    console.log(`[PackQ] Generating 3 QCM for ${theme}...`);
    const qcmResp = await callClaudeWithRetry(buildQCMPrompt(theme, difficulty), 4096);
    const qcmData = extractJSON(qcmResp);
    const questions = qcmData.questions || [];

    // Insert Questions
    const difficultyLevels = ["easy", "medium", "hard"];
    const questionIds: string[] = [];

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
      }
    }

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        question_ids: questionIds,
        stats: {
          duration_ms: durationMs,
          duration_s: Math.round(durationMs / 1000),
          api_calls: 1,
          estimated_cost_usd: +(1 * 0.015).toFixed(3),
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
