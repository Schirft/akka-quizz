/**
 * Edge Function: generate-summaries
 * 
 * 1. Fetches unsummarized articles from news_articles
 * 2. Sends titles to Claude to select the 5-10 most important
 * 3. Scrapes full content via Firecrawl
 * 4. Generates newsletter-style summaries via Claude
 * 5. Stores summaries and marks articles as published
 *
 * Can be triggered manually (admin button) or via cron after fetch-news
 *
 * DEPLOYMENT:
 *   supabase functions deploy generate-summaries --no-verify-jwt
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
      model: "claude-3-5-haiku-20241022",
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

function parseJSON(raw: string): Record<string, string> {
  const trimmed = raw.trim();
  // Try direct parse
  try { return JSON.parse(trimmed); } catch {}
  // Try extracting from code blocks
  try {
    const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) return JSON.parse(codeBlock[1].trim());
  } catch {}
  // Try greedy match
  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  // Safety: check if value contains nested JSON
  try {
    const obj = { summary_en: trimmed };
    if (trimmed.startsWith("{")) return JSON.parse(trimmed);
    return obj;
  } catch {}
  return { summary_en: trimmed };
}

async function scrapeArticle(url: string): Promise<{ content: string; imageUrl: string }> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
    });
    if (!res.ok) return { content: "", imageUrl: "" };
    const data = await res.json();
    const markdown = data?.data?.markdown || "";
    const metadata = data?.data?.metadata || {};
    const imageUrl = metadata?.ogImage || metadata?.["og:image"] || metadata?.image || "";
    return { content: markdown.slice(0, 4000), imageUrl };
  } catch {
    return { content: "", imageUrl: "" };
  }
}
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- MAIN ----------

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Optional: accept custom prompt from admin dashboard
    let customSelectionPrompt = "";
    let customSummaryPrompt = "";
    let manualUrl = "";
    let manualText = "";
    let manualImageUrl = "";
    let manualTitle = "";
    let targetLang = "en";

    try {
      const body = await req.json();
      customSelectionPrompt = body.selectionPrompt || "";
      customSummaryPrompt = body.summaryPrompt || "";
      manualUrl = body.manualUrl || "";
      manualText = body.manualText || "";
      manualImageUrl = body.manualImageUrl || "";
      manualTitle = body.manualTitle || "";
      targetLang = body.language || "en";
    } catch {
      // No body, that's fine (cron call)
    }

    // --- MODE 1: Manual URL addition ---
    if (manualUrl) {
      const scraped = await scrapeArticle(manualUrl);
      const fullContent = scraped.content;
      const scrapedImageUrl = scraped.imageUrl;
      if (!fullContent) {
        return new Response(JSON.stringify({ success: false, error: "Could not scrape URL" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const manualPrompt = `You are a senior analyst writing for a premium startup investment newsletter.
Given an article, generate:
1. An accurate, compelling title (extracted from the article content) in English
2. The same title translated into French, Italian, and Spanish
3. A newsletter-style summary in 4 languages (300-400 words each)
4. The article's category
5. The article's original image URL if visible in the content

Return ONLY valid JSON:
{
  "title": "Extracted article title in English",
  "title_fr": "French title",
  "title_it": "Italian title",
  "title_es": "Spanish title",
  "image_url": "URL of the main image if found, or empty string",
  "summary_en": "English summary (300-400 words, analytical, with why-it-matters and a question at the end)",
  "summary_fr": "French translation",
  "summary_it": "Italian translation",
  "summary_es": "Spanish translation",
  "category": "one of: Funding, AI & Tech, M&A & Exits, Market Moves, European Tech, VC & Investors, Regulation"
}`;
      const summaryResult = await callClaude(manualPrompt, `ARTICLE URL: ${manualUrl}\n\nARTICLE CONTENT:\n${fullContent}`);

      let parsed;
      try {
        parsed = JSON.parse(summaryResult.trim());
      } catch {
        try {
          const codeBlock = summaryResult.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlock) {
            parsed = JSON.parse(codeBlock[1].trim());
          } else {
            const jsonMatch = summaryResult.match(/\{[\s\S]*\}/);
            parsed = JSON.parse(jsonMatch?.[0] || "{}");
          }
        } catch {
          parsed = { title: "Manual Article", summary_en: summaryResult };
        }
      }
      if (parsed.summary_en && parsed.summary_en.trim().startsWith("{")) {
        try {
          const inner = JSON.parse(parsed.summary_en.trim());
          parsed = { ...parsed, ...inner };
        } catch { /* keep as-is */ }
      }

      const { error } = await supabase.from("news_articles").insert({
        title: parsed.title || "Untitled Article",
        title_en: parsed.title || "Untitled Article",
        title_fr: parsed.title_fr || "",
        title_it: parsed.title_it || "",
        title_es: parsed.title_es || "",
        description: parsed.summary_en?.slice(0, 200) || "",
        image_url: parsed.image_url || scrapedImageUrl || "",
        content: fullContent.slice(0, 2000),
        full_content: fullContent,
        source_url: manualUrl,
        source_name: new URL(manualUrl).hostname.replace("www.", ""),
        language: "en",
        category: parsed.category || "general",
        published_at: new Date().toISOString(),
        is_active: true,
        is_featured: false,
        is_published: true,
        summary_en: parsed.summary_en || "",
        summary_fr: parsed.summary_fr || "",
        summary_it: parsed.summary_it || "",
        summary_es: parsed.summary_es || "",
      });

      return new Response(JSON.stringify({ success: !error, mode: "manual", error: error?.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // --- MODE 2: Manual text input ---
    if (manualText && manualText.length > 50) {
      const manualTextPrompt = `You are a senior analyst writing for a premium startup investment newsletter.
Given raw text content (could be a tweet, article excerpt, or original content) in ANY language, generate:
1. Detect the original language of the text
2. A compelling, professional title IN ENGLISH
3. A newsletter-style summary in ENGLISH (250-350 words)
4. A category

The input text may be in French, Italian, Spanish, English, or any language.
Always generate the English summary regardless of input language.

Return ONLY valid JSON:
{
  "title": "Generated title in English",
  "detected_language": "en or fr or it or es",
  "summary_en": "English summary (250-350 words, analytical, with why-it-matters and a question at the end)",
  "category": "one of: Funding, AI & Tech, M&A & Exits, Market Moves, European Tech, VC & Investors, Regulation"
}
Return ONLY the JSON object, no markdown, no code blocks.`;

      const summaryResult = await callClaude(manualTextPrompt, `RAW TEXT CONTENT:\n\n${manualText.slice(0, 4000)}`, 2048);
      let parsed = parseJSON(summaryResult);

      // Use manualTitle if provided, otherwise use AI-generated title
      const finalTitle = manualTitle || parsed.title || "Untitled";

      // Translate to FR/IT/ES (including title)
      let summary_fr = "", summary_it = "", summary_es = "";
      let title_fr = "", title_it = "", title_es = "";
      if (parsed.summary_en && parsed.summary_en.length >= 50) {
        try {
          const transResult = await callClaude(
            TRANSLATION_PROMPT,
            `TITLE TO TRANSLATE: ${finalTitle}\n\nENGLISH SUMMARY TO TRANSLATE:\n\n${parsed.summary_en}`,
            4096
          );
          const frMatch = transResult.match(/"summary_fr"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"summary_it|"\s*,\s*"summary_es|"\s*\})/);
          const itMatch = transResult.match(/"summary_it"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"summary_es|"\s*,\s*"summary_fr|"\s*\})/);
          const esMatch = transResult.match(/"summary_es"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"summary_fr|"\s*,\s*"summary_it|"\s*\})/);
          summary_fr = frMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";
          summary_it = itMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";
          summary_es = esMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";

          const titleFrMatch = transResult.match(/"title_fr"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"title_|"\s*,\s*"summary_|"\s*\})/);
          const titleItMatch = transResult.match(/"title_it"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"title_|"\s*,\s*"summary_|"\s*\})/);
          const titleEsMatch = transResult.match(/"title_es"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"title_|"\s*,\s*"summary_|"\s*\})/);
          title_fr = titleFrMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";
          title_it = titleItMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";
          title_es = titleEsMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";
        } catch (transErr) {
          console.error("Translation failed:", (transErr as Error).message);
        }
      }

      const { error } = await supabase.from("news_articles").insert({
        title: finalTitle,
        title_en: finalTitle,
        title_fr: title_fr,
        title_it: title_it,
        title_es: title_es,
        description: (parsed.summary_en || "").slice(0, 200),
        content: manualText.slice(0, 2000),
        full_content: manualText,
        source_url: `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        source_name: "Akka Editorial",
        language: "en",
        category: parsed.category || "general",
        published_at: new Date().toISOString(),
        image_url: manualImageUrl || "",
        is_active: true,
        is_featured: false,
        is_published: (parsed.summary_en || "").length >= 50,
        summary_en: parsed.summary_en || "",
        summary_fr: summary_fr,
        summary_it: summary_it,
        summary_es: summary_es,
      });

      return new Response(JSON.stringify({ success: !error, mode: "text", error: error?.message }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // --- MODE 3: Auto-generate from existing unsummarized articles ---

    // Step 1: Get unsummarized articles for target language from last 48h
    const summaryCol = `summary_${targetLang}`;
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: articles, error: fetchErr } = await supabase
      .from("news_articles")
      .select("id, title, description, content, source_url, source_name, category, language")
      .eq("language", targetLang)
      .is(summaryCol, null)
      .gte("published_at", twoDaysAgo)
      .order("published_at", { ascending: false })
      .limit(30);

    if (fetchErr || !articles?.length) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No unsummarized articles found",
        count: 0 
      }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Adapt summary prompt for target language
    const langNames: Record<string, string> = { en: "English", fr: "French", it: "Italian", es: "Spanish" };
    const isLocalLang = targetLang !== "en";

    // Step 2: Ask Claude to select the most important articles
    const selectionPrompt = customSelectionPrompt || DEFAULT_SELECTION_PROMPT;
    const articleList = articles.map((a, i) => 
      `${i + 1}. [${a.category}] ${a.title}\n   Source: ${a.source_name}\n   Description: ${(a.description || "").slice(0, 150)}`
    ).join("\n\n");

    const selectionResult = await callClaude(
      selectionPrompt,
      `Here are ${articles.length} recent articles:\n\n${articleList}\n\nReturn ONLY a JSON array of the selected article numbers, e.g. [1, 3, 5, 7, 9]. Select 5-10 articles maximum.`,
      500
    );

    let selectedIndices: number[];
    try {
      const jsonMatch = selectionResult.match(/\[[\d,\s]+\]/);
      selectedIndices = JSON.parse(jsonMatch?.[0] || "[]");
    } catch {
      selectedIndices = [1, 2, 3, 4, 5]; // Fallback: first 5
    }

    const selectedArticles = selectedIndices
      .map(i => articles[i - 1])
      .filter(Boolean)
      .slice(0, 3);

    if (!selectedArticles.length) {
      return new Response(JSON.stringify({ success: true, message: "No articles selected", count: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Step 3: Scrape + Summarize each selected article
    const summaryPrompt = customSummaryPrompt || DEFAULT_SUMMARY_PROMPT;
    let summarized = 0;
    const results: { id: string; title: string; status: string }[] = [];

    for (const article of selectedArticles) {
      try {
        // Scrape full content
        const scraped3 = await scrapeArticle(article.source_url);
        let fullContent = scraped3.content;
        const scrapedImageUrl3 = scraped3.imageUrl;
        // Fallback to GNews content if scrape fails
        if (!fullContent || fullContent.length < 200) {
          fullContent = `Title: ${article.title}\nDescription: ${article.description || ""}\nContent: ${article.content || ""}`;
        }
        // --- CALL 1: Generate EN summary ---
        const summaryResult = await callClaude(
          summaryPrompt,
          `ARTICLE TITLE: ${article.title}\nSOURCE: ${article.source_name}\nCATEGORY: ${article.category}\n\nFULL ARTICLE CONTENT:\n${fullContent}`,
          2048
        );
        let parsed = parseJSON(summaryResult);
        console.log("PARSED KEYS:", Object.keys(parsed), "EN length:", (parsed.summary_en || "").length);
        
        // --- CALL 2: Translate to FR/IT/ES (only for EN articles with real summary) ---
        if (!isLocalLang && parsed.summary_en && parsed.summary_en.length >= 50) {
          try {
            const transResult = await callClaude(
              TRANSLATION_PROMPT,
              `TITLE TO TRANSLATE: ${article.title}\n\nENGLISH SUMMARY TO TRANSLATE:\n\n${parsed.summary_en}`,
              4096
            );
            // Extract each translation by regex - more robust than JSON.parse with special chars
            const frMatch = transResult.match(/"summary_fr"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"summary_it|"\s*,\s*"summary_es|"\s*\})/);
            const itMatch = transResult.match(/"summary_it"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"summary_es|"\s*,\s*"summary_fr|"\s*\})/);
            const esMatch = transResult.match(/"summary_es"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"summary_fr|"\s*,\s*"summary_it|"\s*\})/);
            parsed.summary_fr = frMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";
            parsed.summary_it = itMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";
            parsed.summary_es = esMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";

            // Extract translated titles
            const titleFrMatch = transResult.match(/"title_fr"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"title_|"\s*,\s*"summary_|"\s*\})/);
            const titleItMatch = transResult.match(/"title_it"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"title_|"\s*,\s*"summary_|"\s*\})/);
            const titleEsMatch = transResult.match(/"title_es"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"title_|"\s*,\s*"summary_|"\s*\})/);
            parsed.title_fr = titleFrMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";
            parsed.title_it = titleItMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";
            parsed.title_es = titleEsMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "";
            console.log("REGEX FR:", parsed.summary_fr.length, "IT:", parsed.summary_it.length, "ES:", parsed.summary_es.length);
          } catch (transErr) {
            console.error("Translation failed:", (transErr as Error).message);
          }
        }

        // Update article with summary
        const { error: updateErr } = await supabase
          .from("news_articles")
          .update({
            full_content: fullContent.slice(0, 50000),
            image_url: scrapedImageUrl3 || "",
            title_en: article.title,
            title_fr: parsed.title_fr || "",
            title_it: parsed.title_it || "",
            title_es: parsed.title_es || "",
            summary_en: isLocalLang ? (parsed.summary_en || "") : (parsed.summary_en || parsed.summary || ""),
            summary_fr: isLocalLang && targetLang === "fr" ? (parsed.summary_fr || parsed.summary || "") : (parsed.summary_fr || ""),
            summary_it: isLocalLang && targetLang === "it" ? (parsed.summary_it || parsed.summary || "") : (parsed.summary_it || ""),
            summary_es: isLocalLang && targetLang === "es" ? (parsed.summary_es || parsed.summary || "") : (parsed.summary_es || ""),
            // Only publish if we have a real summary (min 50 chars)
            is_published: (
              isLocalLang
                ? (parsed[`summary_${targetLang}`] || parsed.summary || "").length >= 50
                : (parsed.summary_en || parsed.summary || "").length >= 50
            ),
            is_featured: summarized === 0, // First article is featured
          })
          .eq("id", article.id);

        if (!updateErr) {
          summarized++;
          results.push({ id: article.id, title: article.title, status: "ok" });
        } else {
          results.push({ id: article.id, title: article.title, status: `error: ${updateErr.message}` });
        }
      } catch (err) {
        results.push({ id: article.id, title: article.title, status: `error: ${(err as Error).message}` });
      }

      // Rate limit between articles
      await sleep(500);
    }

    return new Response(JSON.stringify({
      success: true,
      mode: "auto",
      analyzed: articles.length,
      selected: selectedArticles.length,
      summarized,
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

// ---------- DEFAULT PROMPTS ----------

const DEFAULT_SELECTION_PROMPT = `You are the editor-in-chief of a daily newsletter for European startup investors (similar to StrictlyVC and The Human Guide).

Your job is to select the 5-10 MOST IMPORTANT articles from a list, based on these criteria:
- Major funding rounds (Series B+, $50M+)
- Acquisitions, IPOs, major exits
- Market crashes, corrections, interest rate changes
- Major tech trends (AI, crypto, biotech, climate tech)
- European unicorns and ecosystem news
- Major VC fund raises
- Regulatory changes (EU AI Act, GDPR, SEC)
- GAFAM/Big Tech moves affecting startups

EXCLUDE:
- Small local startups with no global relevance
- Opinion pieces without news value
- Celebrity/entertainment news
- Duplicate stories (pick the best source)

Select the articles that a busy startup investor MUST know about today.`;

const DEFAULT_SUMMARY_PROMPT = `You are a senior analyst writing for a premium startup investment newsletter (style: StrictlyVC meets The Human Guide).

Generate a newsletter-style summary in ENGLISH ONLY. Return ONLY valid JSON:
{
  "summary_en": "Your English summary here",
  "category": "one of: Funding, AI & Tech, M&A & Exits, Market Moves, European Tech, VC & Investors, Regulation"
}

WRITING STYLE:
- Professional but engaging, like talking to a smart investor friend
- Start with the key fact, then add context
- Include specific numbers (amounts raised, valuations, percentages)
- Why it matters perspective for investors
- End with a reflective question for investors
- Summary MUST be 250-350 words. Not shorter. Not much longer.
- Structure: 1) Key fact 2) Context 3) Market impact 4) Why it matters 5) Thought-provoking question
- DO NOT just repeat the article. Add analytical value.

Return ONLY the JSON object, no markdown, no code blocks.`;

const TRANSLATION_PROMPT = `You are a professional translator for a startup investment newsletter.
Translate the following newsletter title and summary into French, Italian, and Spanish.
Keep the same professional tone, analytical style, and structure. Keep all numbers, company names, and technical terms unchanged.
Return ONLY valid JSON:
{
  "title_fr": "French title",
  "title_it": "Italian title",
  "title_es": "Spanish title",
  "summary_fr": "French translation of summary",
  "summary_it": "Italian translation of summary",
  "summary_es": "Spanish translation of summary"
}
Return ONLY the JSON object, no markdown, no code blocks.`;
