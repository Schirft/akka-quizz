/**
 * Edge Function: regenerate-summaries
 *
 * Re-generates ALL existing article summaries using the new
 * [KEY_FACT] / [TAKEAWAY] structured template.
 *
 * Processes articles in batches of 5 to stay within the edge-function timeout.
 * Call multiple times (via admin button) until all articles are processed.
 *
 * Body params:
 *   batch_size?: number  (default 5, max 10)
 *   offset?: number      (default 0 — skip already-processed articles)
 *   dry_run?: boolean    (default false — if true, returns what would be processed)
 *
 * DEPLOYMENT:
 *   supabase functions deploy regenerate-summaries --no-verify-jwt
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------- HELPERS ----------

async function callClaude(system: string, user: string, maxTokens = 8192): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
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

async function callClaudeWithRetry(system: string, user: string, maxTokens = 8192, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callClaude(system, user, maxTokens);
    } catch (err: any) {
      const msg = err.message || "";
      const isRetryable = msg.includes("529") || msg.includes("500") || msg.includes("overloaded") || msg.includes("rate");
      if (isRetryable && attempt < retries) {
        const delay = Math.min(attempt * 8000, 30000);
        console.log(`[Retry] Attempt ${attempt}/${retries} failed, waiting ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error("All retry attempts failed");
}

async function scrapeArticle(url: string): Promise<string> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return (data?.data?.markdown || "").slice(0, 4000);
  } catch {
    return "";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function robustParseJSON(raw: string): Record<string, string> {
  const trimmed = raw.trim();
  try { return JSON.parse(trimmed); } catch {}
  try {
    const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) return JSON.parse(codeBlock[1].trim());
  } catch {}
  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return { summary_en: trimmed };
}

function cleanSummary(text: string): string {
  if (!text) return "";
  let cleaned = text
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\/g, "")
    .trim();
  // Remove leading/trailing quotes
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned;
}

function isValidSummary(text: string): boolean {
  if (!text || text.length < 50) return false;
  if (text.startsWith("I apologize") || text.startsWith("I'm sorry")) return false;
  return true;
}

// ---------- PROMPTS ----------

const SUMMARY_PROMPT = `You are a senior analyst writing for a premium startup investment newsletter (style: StrictlyVC meets The Human Guide).

Generate a newsletter-style summary in ENGLISH ONLY. Return ONLY valid JSON:
{
  "summary_en": "Your English summary here",
  "category": "one of: startup, vc, fintech, ai, crypto, markets"
}

CATEGORY DEFINITIONS (choose the BEST match):
- startup: General startup ecosystem news, new companies, founders, accelerators, European tech, M&A, exits, IPOs
- vc: Venture capital, funding rounds, seed/series funding, VC fund raises, investor news
- fintech: Financial technology, neobanks, digital payments, market moves, regulation, banking innovation
- ai: Artificial intelligence, machine learning, LLMs, OpenAI, Anthropic, AI startups
- crypto: Cryptocurrency, blockchain, web3, bitcoin, DeFi, NFTs
- markets: Macro-economics, stock markets, IPOs, interest rates, central banks (Fed, ECB), indices (S&P, NASDAQ, CAC40), recessions, M&A of large public companies

STRUCTURED FORMAT — use these tags:
- Start with [KEY_FACT] — one paragraph with the core news fact (who, what, how much)
- Then 2-3 regular paragraphs with context, analysis, and market impact
- End with [TAKEAWAY] — one paragraph with investor insight + thought-provoking question
- Use **bold** for key numbers, company names, and important terms

EXAMPLE STRUCTURE:
[KEY_FACT] **Stripe** has raised **$6.5B** at a **$50B valuation** in what marks the largest private funding round of 2024...

Context paragraph here with industry analysis...

Market impact paragraph with comparison to competitors...

[TAKEAWAY] For investors, this signals that **late-stage fintech** remains attractive despite the broader downturn. The question is: will Stripe's IPO finally happen in 2025?

RULES:
- Summary MUST be 200-300 words (shorter than before — readers skim on mobile)
- Professional but engaging tone
- Include specific numbers (amounts, valuations, percentages)
- DO NOT just repeat the article. Add analytical value.

Return ONLY the JSON object, no markdown, no code blocks.`;

function buildTranslationPrompt(langs: string[]): string {
  const langNames: Record<string, string> = { fr: "French", it: "Italian", es: "Spanish" };
  const targetLangs = langs.filter(l => l !== "en").map(l => langNames[l] || l).join(", ");
  const jsonFields: string[] = [];
  langs.filter(l => l !== "en").forEach(l => {
    jsonFields.push(`  "title_${l}": "${langNames[l] || l} title"`);
    jsonFields.push(`  "summary_${l}": "${langNames[l] || l} translation of summary"`);
  });
  return `You are a professional translator for a startup investment newsletter.
Translate the following newsletter title and summary into ${targetLangs}.
Keep the same professional tone, analytical style, and structure. Keep all numbers, company names, and technical terms unchanged.
Keep the [KEY_FACT] and [TAKEAWAY] tags in your translation.
Return ONLY valid JSON:
{
${jsonFields.join(",\n")}
}
Return ONLY the JSON object, no markdown, no code blocks.`;
}

const TRANSLATION_PROMPT = buildTranslationPrompt(["fr", "it", "es"]);

// ---------- MAIN ----------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 5, 10);
    const offset = body.offset || 0;
    const dryRun = body.dry_run || false;

    // Fetch published articles that need re-generation
    // We process articles that already have summary_en (they were already published)
    const { data: articles, error: fetchErr } = await supabase
      .from("news_articles")
      .select("id, title, source_url, source_name, description, content, category, full_content, summary_en")
      .eq("is_active", true)
      .eq("is_published", true)
      .not("summary_en", "is", null)
      .order("published_at", { ascending: false })
      .range(offset, offset + batchSize - 1);

    if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`);
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No more articles to process",
        processed: 0,
        offset,
      }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Count total remaining for progress tracking
    const { count: totalCount } = await supabase
      .from("news_articles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("is_published", true)
      .not("summary_en", "is", null);

    if (dryRun) {
      return new Response(JSON.stringify({
        success: true,
        dry_run: true,
        total_articles: totalCount,
        batch_size: batchSize,
        offset,
        articles: articles.map(a => ({ id: a.id, title: a.title, category: a.category })),
      }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    console.log(`[Regenerate] Processing batch of ${articles.length} articles (offset=${offset}, total=${totalCount})`);

    const results: { id: string; title: string; status: string }[] = [];
    let processed = 0;
    const startTime = Date.now();
    const MAX_WALL_CLOCK_MS = 135000; // 135s limit

    for (const article of articles) {
      if (Date.now() - startTime > MAX_WALL_CLOCK_MS) {
        results.push({ id: article.id, title: article.title, status: "skipped: timeout" });
        continue;
      }

      try {
        // Use existing full_content if available, otherwise re-scrape
        let fullContent = article.full_content || "";
        if (!fullContent || fullContent.length < 200) {
          fullContent = await scrapeArticle(article.source_url);
        }
        if (!fullContent || fullContent.length < 200) {
          fullContent = `Title: ${article.title}\nDescription: ${article.description || ""}\nContent: ${article.content || ""}`;
        }

        // --- CALL 1: Re-generate EN summary with new template ---
        const summaryResult = await callClaudeWithRetry(
          SUMMARY_PROMPT,
          `ARTICLE TITLE: ${article.title}\nSOURCE: ${article.source_name}\nCATEGORY: ${article.category}\n\nFULL ARTICLE CONTENT:\n${fullContent}`,
          2048
        );

        const parsed = robustParseJSON(summaryResult);
        parsed.summary_en = cleanSummary(parsed.summary_en || parsed.summary || "");

        if (!isValidSummary(parsed.summary_en)) {
          results.push({ id: article.id, title: article.title, status: "skipped: invalid summary" });
          continue;
        }

        // --- CALL 2: Translate to FR/IT/ES ---
        let summary_fr = "";
        let summary_it = "";
        let summary_es = "";
        let title_fr = "";
        let title_it = "";
        let title_es = "";

        try {
          const transResult = await callClaudeWithRetry(
            TRANSLATION_PROMPT,
            `TITLE TO TRANSLATE: ${article.title}\n\nENGLISH SUMMARY TO TRANSLATE:\n\n${parsed.summary_en}`,
            4096
          );

          // Parse FR
          const frMatch = transResult.match(/"summary_fr"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:summary_it|summary_es|title_)|"\s*\})/);
          summary_fr = cleanSummary(frMatch?.[1] || "");
          const titleFrMatch = transResult.match(/"title_fr"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:title_|summary_)|"\s*\})/);
          title_fr = cleanSummary(titleFrMatch?.[1] || "");

          // Parse IT
          const itMatch = transResult.match(/"summary_it"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:summary_fr|summary_es|title_)|"\s*\})/);
          summary_it = cleanSummary(itMatch?.[1] || "");
          const titleItMatch = transResult.match(/"title_it"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:title_|summary_)|"\s*\})/);
          title_it = cleanSummary(titleItMatch?.[1] || "");

          // Parse ES
          const esMatch = transResult.match(/"summary_es"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:summary_fr|summary_it|title_)|"\s*\})/);
          summary_es = cleanSummary(esMatch?.[1] || "");
          const titleEsMatch = transResult.match(/"title_es"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:title_|summary_)|"\s*\})/);
          title_es = cleanSummary(titleEsMatch?.[1] || "");
        } catch (transErr) {
          console.error(`[Trans] Failed for ${article.id}:`, (transErr as Error).message);
        }

        // --- Update article ---
        const updateData: Record<string, any> = {
          summary_en: parsed.summary_en,
        };
        if (summary_fr) updateData.summary_fr = summary_fr;
        if (summary_it) updateData.summary_it = summary_it;
        if (summary_es) updateData.summary_es = summary_es;
        if (title_fr) updateData.title_fr = title_fr;
        if (title_it) updateData.title_it = title_it;
        if (title_es) updateData.title_es = title_es;
        // Re-categorize if changed
        const newCategory = (parsed.category || article.category || "startup").toLowerCase();
        if (["startup", "vc", "fintech", "ai", "crypto", "markets"].includes(newCategory)) {
          updateData.category = newCategory;
        }

        const { error: updateErr } = await supabase
          .from("news_articles")
          .update(updateData)
          .eq("id", article.id);

        if (!updateErr) {
          processed++;
          results.push({ id: article.id, title: article.title, status: "ok" });
        } else {
          results.push({ id: article.id, title: article.title, status: `error: ${updateErr.message}` });
        }
      } catch (err) {
        results.push({ id: article.id, title: article.title, status: `error: ${(err as Error).message}` });
      }

      // Rate limit between articles
      await sleep(1000);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    return new Response(JSON.stringify({
      success: true,
      processed,
      total_articles: totalCount,
      next_offset: offset + batchSize,
      has_more: (offset + batchSize) < (totalCount || 0),
      duration_s: duration,
      results,
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
