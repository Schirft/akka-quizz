/**
 * Edge Function: generate-pack-lesson
 *
 * Generates 1 "Lesson of the Day" based on the puzzle context.
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

async function callClaudeWithRetry(prompt: string, maxTokens = 4096, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callClaude(prompt, maxTokens);
    } catch (err: any) {
      const msg = err.message || "";
      const isRetryable = msg.includes("529") || msg.includes("500") || msg.includes("overloaded") || msg.includes("rate");
      if (isRetryable && attempt < retries) {
        const delay = attempt * 5000;
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

    const startTime = Date.now();

    // Generate 1 Lesson
    console.log(`[PackLesson] Generating lesson for ${theme}...`);
    const lessonResp = await callClaudeWithRetry(
      buildLessonPrompt(theme, puzzleTitle, puzzleAnswer, puzzleExplanation),
      4096
    );
    const lessonData = extractJSON(lessonResp);

    // Insert Lesson
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

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        lesson_id: insertedLesson.id,
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
    console.error("generate-pack-lesson error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders() }
    );
  }
});
