/**
 * Edge Function: generate-daily-pack
 *
 * Generates a complete daily challenge pack for a given date and theme:
 *   - 3 QCM questions (themed)
 *   - 1 Puzzle ("The Catch")
 *   - 1 Lesson of the Day
 *   - Translations for all 4 languages (EN, FR, IT, ES)
 *
 * Body: { date: "YYYY-MM-DD", theme?: string }
 *
 * DEPLOYMENT:
 *   supabase functions deploy generate-daily-pack --no-verify-jwt
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Weekly theme rotation (Mon=0 … Sun=6) ──
const WEEKLY_THEMES: Record<number, string> = {
  1: "Fundraising & Dilution",
  2: "Cap Tables & Valuation",
  3: "Due Diligence",
  4: "Term Sheets & Legal",
  5: "Portfolio Strategy",
  6: "Startup Metrics & KPIs",
  0: "Ecosystem & Trends",
};

// ── Puzzle types ──
const PUZZLE_TYPES = [
  "tap_to_spot",
  "ab_choice",
  "fill_gap",
  "match_chart",
  "before_after",
  "crash_point",
] as const;

// ── Helpers ──

async function callClaude(
  system: string,
  user: string,
  maxTokens = 4096
): Promise<string> {
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
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function robustParse(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  let clean = trimmed;
  if (clean.startsWith("```json"))
    clean = clean.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  if (clean.startsWith("```"))
    clean = clean.replace(/^```\s*/, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(clean);
  } catch {}
  try {
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  throw new Error("Could not parse AI response as JSON");
}

// ── Main ──

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const targetDate: string = body.date || new Date().toISOString().split("T")[0];

    // Determine theme from day of week or override
    const dow = new Date(targetDate + "T12:00:00Z").getDay();
    const theme: string = body.theme || WEEKLY_THEMES[dow] || "General";

    // Pick a random puzzle type for today
    const puzzleType =
      PUZZLE_TYPES[Math.floor(Math.random() * PUZZLE_TYPES.length)];

    // ────────────────────────────────
    // STEP 1: Generate 3 QCM questions
    // ────────────────────────────────
    const qcmPrompt = `You are an expert quiz creator for a startup investment learning app called Akka.
Today's theme: "${theme}"

Generate exactly 3 multiple-choice questions about "${theme}" for aspiring startup investors.

Rules:
- Each question has exactly 4 answer options
- Exactly one answer is correct (0-based index)
- Questions should be educational and challenging but fair
- Include a short explanation for the correct answer
- Provide all content in English first

Return ONLY valid JSON:
{
  "questions": [
    {
      "question_en": "Question text in English",
      "answers_en": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer_index": 0,
      "explanation_en": "Short explanation of why this is correct",
      "category": "${theme}"
    }
  ]
}`;

    const qcmRaw = await callClaude(qcmPrompt, `Generate 3 questions for theme: ${theme}`);
    const qcmData = robustParse(qcmRaw) as {
      questions: Array<{
        question_en: string;
        answers_en: string[];
        correct_answer_index: number;
        explanation_en: string;
        category: string;
      }>;
    };

    if (!qcmData.questions || qcmData.questions.length < 3) {
      throw new Error("AI did not generate 3 questions");
    }

    // ────────────────────────────────
    // STEP 2: Translate QCM to FR, IT, ES
    // ────────────────────────────────
    const transQcmPrompt = `Translate these 3 quiz questions and their answer options into French, Italian, and Spanish.
Keep the same structure. Return ONLY valid JSON:
{
  "questions": [
    {
      "question_fr": "...", "answers_fr": ["...","...","...","..."], "explanation_fr": "...",
      "question_it": "...", "answers_it": ["...","...","...","..."], "explanation_it": "...",
      "question_es": "...", "answers_es": ["...","...","...","..."], "explanation_es": "..."
    }
  ]
}`;

    const questionsJson = JSON.stringify(
      qcmData.questions.map((q) => ({
        question_en: q.question_en,
        answers_en: q.answers_en,
        explanation_en: q.explanation_en,
      }))
    );

    const transQcmRaw = await callClaude(transQcmPrompt, questionsJson);
    const transQcm = robustParse(transQcmRaw) as {
      questions: Array<Record<string, unknown>>;
    };

    // Insert questions into DB
    const questionIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const q = qcmData.questions[i];
      const tr = transQcm.questions?.[i] || {};

      // DB uses 1-based correct_answer_index
      const correctIndex1 = (q.correct_answer_index || 0) + 1;

      const { data: inserted, error: qErr } = await supabase
        .from("questions")
        .insert({
          question_en: q.question_en,
          question_fr: (tr.question_fr as string) || "",
          question_it: (tr.question_it as string) || "",
          question_es: (tr.question_es as string) || "",
          answers_en: q.answers_en,
          answers_fr: (tr.answers_fr as string[]) || [],
          answers_it: (tr.answers_it as string[]) || [],
          answers_es: (tr.answers_es as string[]) || [],
          correct_answer_index: correctIndex1,
          explanation_en: q.explanation_en || "",
          explanation_fr: (tr.explanation_fr as string) || "",
          explanation_it: (tr.explanation_it as string) || "",
          explanation_es: (tr.explanation_es as string) || "",
          category: theme,
          theme: theme,
          difficulty: "medium",
          status: "approved",
        })
        .select("id")
        .single();

      if (qErr) throw new Error(`Insert question ${i}: ${qErr.message}`);
      questionIds.push(inserted.id);
    }

    // ────────────────────────────────
    // STEP 3: Generate puzzle
    // ────────────────────────────────
    const puzzlePrompts: Record<string, string> = {
      tap_to_spot: `Create a "Spot the Error" puzzle about "${theme}".
Present a short statement (2-3 sentences) about startup investing that contains ONE factual error.
The user must tap/identify the wrong part.
Return JSON: { "statement_en": "...", "error_part_en": "the specific wrong phrase", "correction_en": "the correct phrase", "explanation_en": "why" }`,
      ab_choice: `Create an A/B choice puzzle about "${theme}".
Present a startup scenario and two possible strategies. One is clearly better.
Return JSON: { "scenario_en": "...", "option_a_en": "...", "option_b_en": "...", "correct_option": "a" or "b", "explanation_en": "..." }`,
      fill_gap: `Create a fill-the-gap puzzle about "${theme}".
Present a statement with one missing key term (shown as ___).
Provide 3 options, one correct.
Return JSON: { "statement_en": "... ___ ...", "options_en": ["opt1","opt2","opt3"], "correct_index": 0, "explanation_en": "..." }`,
      match_chart: `Create a chart matching puzzle about "${theme}".
Describe a chart pattern (e.g. "J-curve in VC returns") and ask what it represents.
Provide 3 options.
Return JSON: { "chart_description_en": "...", "options_en": ["opt1","opt2","opt3"], "correct_index": 0, "explanation_en": "..." }`,
      before_after: `Create a before/after puzzle about "${theme}".
Show a startup metric before and after an event, ask what happened.
Return JSON: { "before_en": "...", "after_en": "...", "question_en": "What happened?", "options_en": ["opt1","opt2","opt3"], "correct_index": 0, "explanation_en": "..." }`,
      crash_point: `Create a "crash point" puzzle about "${theme}".
Describe a startup timeline with a critical decision point.
Return JSON: { "timeline_en": "...", "question_en": "Where did it go wrong?", "options_en": ["opt1","opt2","opt3"], "correct_index": 0, "explanation_en": "..." }`,
    };

    const puzzleRaw = await callClaude(
      `You are creating an interactive puzzle for a startup investment app. Theme: "${theme}". Puzzle type: "${puzzleType}".
Return ONLY valid JSON as specified.`,
      puzzlePrompts[puzzleType]
    );
    const puzzleData = robustParse(puzzleRaw);

    // Translate puzzle
    const transPuzzleRaw = await callClaude(
      `Translate all _en fields in this JSON to French (_fr), Italian (_it), and Spanish (_es).
Keep _en fields, add translations. Return ONLY the complete JSON with all fields.`,
      JSON.stringify(puzzleData)
    );
    const puzzleTranslated = robustParse(transPuzzleRaw);

    // Merge originals + translations
    const fullPuzzle = { ...puzzleData, ...puzzleTranslated };

    const { data: insertedPuzzle, error: puzzleErr } = await supabase
      .from("puzzles")
      .insert({
        type: puzzleType,
        theme: theme,
        content: fullPuzzle,
        difficulty: "medium",
      })
      .select("id")
      .single();

    if (puzzleErr) throw new Error(`Insert puzzle: ${puzzleErr.message}`);

    // ────────────────────────────────
    // STEP 4: Generate lesson
    // ────────────────────────────────
    const lessonRaw = await callClaude(
      `You are creating a "Lesson of the Day" for a startup investment app.
Theme: "${theme}". Write a concise, high-value micro-lesson (150-250 words).
Structure: Key concept → Real example → Actionable takeaway.
Return ONLY valid JSON:
{
  "title_en": "Lesson title",
  "content_en": "Full lesson text (150-250 words)",
  "key_takeaway_en": "One-sentence key takeaway"
}`,
      `Create a lesson about: ${theme}`
    );
    const lessonData = robustParse(lessonRaw);

    // Translate lesson
    const transLessonRaw = await callClaude(
      `Translate these fields to French, Italian, and Spanish. Return ONLY valid JSON with all fields:
{
  "title_fr": "...", "content_fr": "...", "key_takeaway_fr": "...",
  "title_it": "...", "content_it": "...", "key_takeaway_it": "...",
  "title_es": "...", "content_es": "...", "key_takeaway_es": "..."
}`,
      JSON.stringify(lessonData)
    );
    const lessonTrans = robustParse(transLessonRaw);

    const { data: insertedLesson, error: lessonErr } = await supabase
      .from("daily_lessons")
      .insert({
        title_en: (lessonData.title_en as string) || "",
        title_fr: (lessonTrans.title_fr as string) || "",
        title_it: (lessonTrans.title_it as string) || "",
        title_es: (lessonTrans.title_es as string) || "",
        content_en: (lessonData.content_en as string) || "",
        content_fr: (lessonTrans.content_fr as string) || "",
        content_it: (lessonTrans.content_it as string) || "",
        content_es: (lessonTrans.content_es as string) || "",
        key_takeaway_en: (lessonData.key_takeaway_en as string) || "",
        key_takeaway_fr: (lessonTrans.key_takeaway_fr as string) || "",
        key_takeaway_it: (lessonTrans.key_takeaway_it as string) || "",
        key_takeaway_es: (lessonTrans.key_takeaway_es as string) || "",
        theme: theme,
      })
      .select("id")
      .single();

    if (lessonErr) throw new Error(`Insert lesson: ${lessonErr.message}`);

    // ────────────────────────────────
    // STEP 5: Create/update daily_quizzes entry
    // ────────────────────────────────
    // Pad question IDs to 5 (fill remaining with null)
    const q1 = questionIds[0] || null;
    const q2 = questionIds[1] || null;
    const q3 = questionIds[2] || null;

    const { error: quizErr } = await supabase.from("daily_quizzes").upsert(
      {
        quiz_date: targetDate,
        question_1_id: q1,
        question_2_id: q2,
        question_3_id: q3,
        question_4_id: null,
        question_5_id: null,
        theme: theme,
        puzzle_id: insertedPuzzle.id,
        lesson_id: insertedLesson.id,
      },
      { onConflict: "quiz_date" }
    );

    if (quizErr) throw new Error(`Upsert daily_quizzes: ${quizErr.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        date: targetDate,
        theme,
        questions: questionIds.length,
        puzzle_type: puzzleType,
        puzzle_id: insertedPuzzle.id,
        lesson_id: insertedLesson.id,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
