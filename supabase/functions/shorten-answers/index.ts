/**
 * Edge Function: shorten-answers
 *
 * One-time batch job to shorten existing QCM answers to max 8-10 words.
 * Processes questions with answers longer than 60 characters.
 * Uses Claude Haiku for cost efficiency.
 *
 * Deployment:
 *   supabase functions deploy shorten-answers --no-verify-jwt
 *
 * Call: POST /shorten-answers { "batch_size": 10, "dry_run": false }
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

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-20250514",
      max_tokens: 4096,
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
  const raw = jsonMatch ? jsonMatch[1].trim() : (() => {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) return text.slice(start, end + 1);
    const arrStart = text.indexOf("[");
    const arrEnd = text.lastIndexOf("]");
    if (arrStart >= 0 && arrEnd > arrStart) return text.slice(arrStart, arrEnd + 1);
    throw new Error("No valid JSON found");
  })();
  try { return JSON.parse(raw); } catch (_) { /* fallback */ }
  const cleaned = raw.replace(/[\x00-\x1f\x7f]/g, (ch: string) => {
    if (ch === "\n" || ch === "\r" || ch === "\t") return " ";
    return "";
  });
  return JSON.parse(cleaned);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 10, 20);
    const dryRun = body.dry_run ?? true;

    // Find questions with long answers (>60 chars in any answer)
    const { data: questions, error: fetchErr } = await supabase
      .from("questions")
      .select("id, question_en, answers_en, answers_fr, answers_it, answers_es")
      .eq("status", "approved")
      .limit(200);

    if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`);

    // Filter to only questions with at least one long answer
    const longQuestions = (questions || []).filter((q: any) => {
      const answers = q.answers_en || [];
      return answers.some((a: string) => a && a.length > 60);
    });

    // Take batch
    const batch = longQuestions.slice(0, batchSize);

    if (batch.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No questions with long answers found", total_remaining: 0 }),
        { headers: corsHeaders() }
      );
    }

    console.log(`[ShortenAnswers] Processing ${batch.length} questions (${longQuestions.length} total remaining)`);

    // Build batch prompt — process multiple questions at once for efficiency
    const questionsForPrompt = batch.map((q: any, i: number) => ({
      index: i,
      id: q.id,
      question: q.question_en,
      answers: q.answers_en,
    }));

    const prompt = `Shorten these quiz answer options to a MAXIMUM of 8-10 words each.
Keep the meaning intact. Keep the correct answer at the same index.
If an answer is already short enough (≤10 words), keep it unchanged.

RULES:
- Maximum 8-10 words per answer
- Preserve the core meaning
- Use concise phrases, not full sentences
- Keep numbers, names, and key terms

Questions:
${JSON.stringify(questionsForPrompt, null, 2)}

Return ONLY valid JSON array matching the same structure:
[
  { "index": 0, "answers": ["short A", "short B", "short C", "short D"] },
  ...
]`;

    const resp = await callClaude(prompt);
    const shortened = extractJSON(resp);
    let updated = 0;

    for (const item of shortened) {
      const q = batch[item.index];
      if (!q || !item.answers || item.answers.length !== 4) continue;

      // Validate all answers are actually shorter
      const allShort = item.answers.every((a: string) => a.split(/\s+/).length <= 12);
      if (!allShort) {
        console.warn(`[ShortenAnswers] Question ${q.id}: some answers still too long, skipping`);
        continue;
      }

      if (!dryRun) {
        // Update EN answers
        const { error: uErr } = await supabase
          .from("questions")
          .update({ answers_en: item.answers })
          .eq("id", q.id);

        if (uErr) {
          console.error(`[ShortenAnswers] Update error for ${q.id}:`, uErr);
        } else {
          updated++;
        }

        // Also shorten translations if they exist and are long
        for (const lang of ["fr", "it", "es"]) {
          const langAnswers = q[`answers_${lang}`];
          if (langAnswers && langAnswers.some((a: string) => a && a.length > 80)) {
            // For translated answers, just trim proportionally (don't re-translate)
            // The next generation will produce short answers naturally
            console.log(`[ShortenAnswers] Note: ${q.id} has long ${lang} answers — will be fixed on next generation`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dryRun,
        processed: batch.length,
        updated: dryRun ? 0 : updated,
        total_remaining: longQuestions.length - batch.length,
        sample: shortened.slice(0, 2),
      }),
      { headers: corsHeaders() }
    );
  } catch (err) {
    console.error("shorten-answers error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: corsHeaders() }
    );
  }
});
