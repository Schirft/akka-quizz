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

/**
 * Download an external image and store it in Supabase Storage.
 * Returns the Supabase public URL, or falls back to the original URL on failure.
 */
async function downloadAndStoreImage(imageUrl: string, articleId: string): Promise<string> {
  if (!imageUrl || imageUrl.includes("supabase.co/storage")) return imageUrl; // Already stored
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AkkaBot/1.0)",
        "Accept": "image/*",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.log(`[Image] Download failed (${res.status}) for ${articleId}`);
      return imageUrl;
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return imageUrl;

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength < 1000 || arrayBuffer.byteLength > 10_000_000) {
      console.log(`[Image] Skipped (size: ${arrayBuffer.byteLength}B) for ${articleId}`);
      return imageUrl;
    }

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
      "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
    };
    const ext = extMap[contentType] || "jpg";
    const fileName = `${articleId}.${ext}`;

    const { error } = await supabase.storage
      .from("news-images")
      .upload(fileName, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`[Image] Upload failed for ${articleId}:`, error.message);
      return imageUrl;
    }

    const { data: urlData } = supabase.storage
      .from("news-images")
      .getPublicUrl(fileName);

    console.log(`[Image] Stored ${fileName} (${(arrayBuffer.byteLength / 1024).toFixed(1)}KB)`);
    return urlData.publicUrl;
  } catch (err) {
    console.error(`[Image] Failed for ${articleId}:`, (err as Error).message);
    return imageUrl;
  }
}

async function callClaudeWithRetry(system: string, user: string, maxTokens = 8192, retries = 5): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await callClaude(system, user, maxTokens);
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

/** Validate that a summary is real content, not an error or raw JSON */
function isValidSummary(text: string): boolean {
  if (!text || text.length < 50) return false;
  if (text.startsWith("I apologize") || text.startsWith("I'm sorry")) return false;
  if (text.startsWith("{") || text.startsWith('"title"')) return false;
  if (text.includes('"summary_en"') || text.includes('"category"')) return false;
  return true;
}

/** Clean residual JSON from summary/title text */
function cleanSummary(text: string): string {
  if (!text) return "";
  let clean = text.replace(/^\s*\{?\s*"title"\s*:.*?"summary_en"\s*:\s*"?/, "");
  clean = clean.replace(/"\s*,\s*"category"\s*:.*?\}\s*$/, "");
  clean = clean.replace(/^\s*"/, "").replace(/"\s*$/, "");
  clean = clean.replace(/\\n/g, "\n").replace(/\\"/g, '"');
  return clean.trim();
}

/** Robust JSON parsing — tries JSON.parse, code block extraction, greedy match, then regex fallback */
function robustParseJSON(raw: string): Record<string, string> {
  const trimmed = raw.trim();
  // 1. Clean markdown code blocks
  let cleanResult = trimmed;
  if (cleanResult.startsWith("```json")) cleanResult = cleanResult.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  if (cleanResult.startsWith("```")) cleanResult = cleanResult.replace(/^```\s*/, "").replace(/```\s*$/, "");
  // 2. Try direct JSON.parse
  try { return JSON.parse(cleanResult); } catch {}
  // 3. Try extracting from code blocks
  try {
    const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) return JSON.parse(codeBlock[1].trim());
  } catch {}
  // 4. Try greedy JSON match
  try {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  // 5. Regex fallback for key fields
  const titleMatch = trimmed.match(/"title"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:detected_language|summary_en|category))/);
  const summaryMatch = trimmed.match(/"summary_en"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"category|"\s*\})/);
  const categoryMatch = trimmed.match(/"category"\s*:\s*"([\s\S]*?)"/);
  return {
    title: titleMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "",
    summary_en: summaryMatch?.[1]?.replace(/\\n/g, "\n")?.replace(/\\"/g, '"') || "",
    category: categoryMatch?.[1] || "general",
  };
}

/** Normalize category to one of the 6 valid values */
const VALID_CATEGORIES = ["startup", "vc", "fintech", "ai", "crypto", "markets"];
const CATEGORY_MAP: Record<string, string> = {
  // Exact matches (lowercase)
  "startup": "startup", "startups": "startup",
  "vc": "vc", "venture capital": "vc", "funding": "vc", "vc & investors": "vc",
  "fintech": "fintech", "finance": "fintech", "market moves": "fintech", "regulation": "fintech",
  "ai": "ai", "ai & tech": "ai", "artificial intelligence": "ai", "tech": "ai",
  "crypto": "crypto", "cryptocurrency": "crypto", "blockchain": "crypto", "web3": "crypto",
  "markets": "markets", "market": "markets", "economy": "markets", "macro": "markets", "ipo": "markets", "stock market": "markets", "bourse": "markets",
  "deeptech": "ai", "deep tech": "ai", "biotech": "startup", "climate tech": "startup",
  "m&a & exits": "startup", "m&a": "startup", "european tech": "startup",
  "general": "startup",
};

function normalizeCategory(raw: string): string {
  if (!raw) return "startup";
  const lower = raw.toLowerCase().trim();
  if (VALID_CATEGORIES.includes(lower)) return lower;
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower];
  // Fuzzy match: check if any valid category is a substring
  for (const cat of VALID_CATEGORIES) {
    if (lower.includes(cat)) return cat;
  }
  return "startup"; // Default fallback
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
    let translateLangs: string[] = ["fr", "it", "es"];
    let targetLang = "en";

    try {
      const body = await req.json();
      customSelectionPrompt = body.selectionPrompt || "";
      customSummaryPrompt = body.summaryPrompt || "";
      manualUrl = body.manualUrl || "";
      manualText = body.manualText || "";
      manualImageUrl = body.manualImageUrl || "";
      manualTitle = body.manualTitle || "";
      translateLangs = body.translateLangs || ["fr", "it", "es"];
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

      // Build dynamic translation fields based on translateLangs
      const urlLangFields: string[] = [];
      const urlLangSummaryFields: string[] = [];
      if (translateLangs.includes("fr")) { urlLangFields.push('"title_fr": "French title"'); urlLangSummaryFields.push('"summary_fr": "French translation"'); }
      if (translateLangs.includes("it")) { urlLangFields.push('"title_it": "Italian title"'); urlLangSummaryFields.push('"summary_it": "Italian translation"'); }
      if (translateLangs.includes("es")) { urlLangFields.push('"title_es": "Spanish title"'); urlLangSummaryFields.push('"summary_es": "Spanish translation"'); }

      const manualPrompt = `You are a senior analyst writing for a premium startup investment newsletter.
Given an article, generate:
1. An accurate, compelling title (extracted from the article content) in English
${urlLangFields.length > 0 ? "2. The same title translated into the requested languages\n3. A newsletter-style summary in English + translations (300-400 words each)" : "2. A newsletter-style summary in English (300-400 words)"}
4. The article's category
5. The article's original image URL if visible in the content

Return ONLY valid JSON:
{
  "title": "Extracted article title in English",
  ${urlLangFields.join(",\n  ")}${urlLangFields.length > 0 ? "," : ""}
  "image_url": "URL of the main image if found, or empty string",
  "summary_en": "English summary (300-400 words, analytical, with why-it-matters and a question at the end)",
  ${urlLangSummaryFields.join(",\n  ")}${urlLangSummaryFields.length > 0 ? "," : ""}
  "category": "one of: startup, vc, fintech, ai, crypto, markets"
}
Return ONLY the JSON object, no markdown, no code blocks.

CATEGORY DEFINITIONS:
- startup: General startup ecosystem news, new companies, founders, accelerators, European tech ecosystem, M&A, exits, IPOs
- vc: Venture capital, funding rounds, seed/series funding, VC fund raises, investor news
- fintech: Financial technology, neobanks, digital payments, market moves, regulation, banking innovation
- ai: Artificial intelligence, machine learning, LLMs, OpenAI, Anthropic, AI startups
- crypto: Cryptocurrency, blockchain, web3, bitcoin, DeFi, NFTs
- markets: Macro-economics, stock markets, IPOs, interest rates, central banks (Fed, ECB), indices (S&P, NASDAQ, CAC40), recessions, M&A of large public companies`;
      const summaryResult = await callClaudeWithRetry(manualPrompt, `ARTICLE URL: ${manualUrl}\n\nARTICLE CONTENT:\n${fullContent}`);

      let parsed = robustParseJSON(summaryResult);

      // Clean all fields
      parsed.title = cleanSummary(parsed.title);
      parsed.summary_en = cleanSummary(parsed.summary_en);
      parsed.summary_fr = cleanSummary(parsed.summary_fr || "");
      parsed.summary_it = cleanSummary(parsed.summary_it || "");
      parsed.summary_es = cleanSummary(parsed.summary_es || "");

      // Validate summary_en doesn't contain raw JSON
      if (parsed.summary_en && (parsed.summary_en.includes('"title"') || parsed.summary_en.includes('"category"'))) {
        const reMatch = summaryResult.match(/"summary_en"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:summary_fr|category)|"\s*\})/);
        if (reMatch) parsed.summary_en = cleanSummary(reMatch[1]);
      }

      // Store image in Supabase Storage
      const rawManualImageUrl = parsed.image_url || scrapedImageUrl || "";
      const tempId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const storedManualImageUrl = rawManualImageUrl ? await downloadAndStoreImage(rawManualImageUrl, tempId) : "";

      const { error } = await supabase.from("news_articles").insert({
        title: parsed.title || "Untitled Article",
        title_en: parsed.title || "Untitled Article",
        title_fr: cleanSummary(parsed.title_fr || ""),
        title_it: cleanSummary(parsed.title_it || ""),
        title_es: cleanSummary(parsed.title_es || ""),
        description: (parsed.summary_en || "").slice(0, 200),
        image_url: storedManualImageUrl,
        content: fullContent.slice(0, 2000),
        full_content: fullContent,
        source_url: manualUrl,
        source_name: new URL(manualUrl).hostname.replace("www.", ""),
        language: "en",
        category: normalizeCategory(parsed.category || ""),
        published_at: new Date().toISOString(),
        is_active: true,
        is_featured: false,
        is_published: isValidSummary(parsed.summary_en || ""),
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
  "category": "one of: startup, vc, fintech, ai, crypto, markets"
}
Return ONLY the JSON object, no markdown, no code blocks.

CATEGORY DEFINITIONS:
- startup: General startup ecosystem news, new companies, founders, accelerators, European tech ecosystem, M&A, exits, IPOs
- vc: Venture capital, funding rounds, seed/series funding, VC fund raises, investor news
- fintech: Financial technology, neobanks, digital payments, market moves, regulation, banking innovation
- ai: Artificial intelligence, machine learning, LLMs, OpenAI, Anthropic, AI startups
- crypto: Cryptocurrency, blockchain, web3, bitcoin, DeFi, NFTs
- markets: Macro-economics, stock markets, IPOs, interest rates, central banks (Fed, ECB), indices (S&P, NASDAQ, CAC40), recessions, M&A of large public companies`;

      const summaryResult = await callClaudeWithRetry(manualTextPrompt, `RAW TEXT CONTENT:\n\n${manualText.slice(0, 4000)}`, 2048);
      let parsed = robustParseJSON(summaryResult);

      // Clean all parsed fields
      parsed.title = cleanSummary(parsed.title);
      parsed.summary_en = cleanSummary(parsed.summary_en || "");

      // Validate summary_en doesn't contain raw JSON
      if (parsed.summary_en && (parsed.summary_en.includes('"title"') || parsed.summary_en.includes('"category"'))) {
        const reMatch = summaryResult.match(/"summary_en"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"category|"\s*\})/);
        if (reMatch) parsed.summary_en = cleanSummary(reMatch[1]);
      }

      // Use manualTitle if provided, otherwise use AI-generated title
      const finalTitle = manualTitle || parsed.title || "Untitled";

      // Translate to requested languages (including title)
      let summary_fr = "", summary_it = "", summary_es = "";
      let title_fr = "", title_it = "", title_es = "";
      if (translateLangs.length > 0 && parsed.summary_en && parsed.summary_en.length >= 50) {
        try {
          const transPrompt = buildTranslationPrompt(translateLangs);
          const transResult = await callClaudeWithRetry(
            transPrompt,
            `TITLE TO TRANSLATE: ${finalTitle}\n\nENGLISH SUMMARY TO TRANSLATE:\n\n${parsed.summary_en}`,
            4096
          );
          if (translateLangs.includes("fr")) {
            const frMatch = transResult.match(/"summary_fr"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:summary_it|summary_es|title_)|"\s*\})/);
            summary_fr = cleanSummary(frMatch?.[1] || "");
            const titleFrMatch = transResult.match(/"title_fr"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:title_|summary_)|"\s*\})/);
            title_fr = cleanSummary(titleFrMatch?.[1] || "");
          }
          if (translateLangs.includes("it")) {
            const itMatch = transResult.match(/"summary_it"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:summary_fr|summary_es|title_)|"\s*\})/);
            summary_it = cleanSummary(itMatch?.[1] || "");
            const titleItMatch = transResult.match(/"title_it"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:title_|summary_)|"\s*\})/);
            title_it = cleanSummary(titleItMatch?.[1] || "");
          }
          if (translateLangs.includes("es")) {
            const esMatch = transResult.match(/"summary_es"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:summary_fr|summary_it|title_)|"\s*\})/);
            summary_es = cleanSummary(esMatch?.[1] || "");
            const titleEsMatch = transResult.match(/"title_es"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:title_|summary_)|"\s*\})/);
            title_es = cleanSummary(titleEsMatch?.[1] || "");
          }
        } catch (transErr) {
          console.error("Translation failed:", (transErr as Error).message);
        }
      }

      // Store image in Supabase Storage
      const tempTextId = `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const storedTextImageUrl = manualImageUrl ? await downloadAndStoreImage(manualImageUrl, tempTextId) : "";

      const { error } = await supabase.from("news_articles").insert({
        title: finalTitle,
        title_en: finalTitle,
        title_fr: title_fr,
        title_it: title_it,
        title_es: title_es,
        description: (parsed.summary_en || "").slice(0, 200),
        content: manualText.slice(0, 2000),
        full_content: manualText,
        source_url: tempTextId,
        source_name: "Akka Editorial",
        language: "en",
        category: normalizeCategory(parsed.category || ""),
        published_at: new Date().toISOString(),
        image_url: storedTextImageUrl,
        is_active: true,
        is_featured: false,
        is_published: isValidSummary(parsed.summary_en || ""),
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

    // Step 1: Get unsummarized articles for target language
    // Use a 7-day window to catch all categories including rare ones
    const summaryCol = `summary_${targetLang}`;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: articles, error: fetchErr } = await supabase
      .from("news_articles")
      .select("id, title, description, content, source_url, source_name, category, language, image_url")
      .eq("language", targetLang)
      .or(`${summaryCol}.is.null,${summaryCol}.eq.`)
      .gte("published_at", sevenDaysAgo)
      .order("published_at", { ascending: false })
      .limit(60);

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

    // Step 2: Category-balanced selection
    // Goal: ensure ALL 6 categories are represented in the final selection
    // Edge function has ~150s timeout, so we limit to 6 articles per run
    // With 3 cron runs/day, that's up to 18 published articles/day
    const TARGET_PER_CATEGORY = 1; // At least 1 per empty category
    const MAX_TOTAL = 6; // Max articles per run (must stay under 150s edge function limit)

    // Group articles by category
    const byCategory: Record<string, typeof articles> = {};
    for (const a of articles) {
      const cat = a.category || "startup";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(a);
    }

    // Check which categories already have published articles today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { data: alreadyPublished } = await supabase
      .from("news_articles")
      .select("category")
      .eq("is_published", true)
      .gte("published_at", todayStart.toISOString());

    const publishedCategoryCounts: Record<string, number> = {};
    for (const p of (alreadyPublished || [])) {
      const cat = p.category || "startup";
      publishedCategoryCounts[cat] = (publishedCategoryCounts[cat] || 0) + 1;
    }

    // Build category-balanced selection:
    // 1. Prioritize categories with 0 published articles today
    // 2. Then fill remaining slots with best articles from any category
    const selectedArticles: typeof articles = [];
    const usedIds = new Set<string>();
    const ALL_CATEGORIES = ["startup", "vc", "fintech", "ai", "crypto", "markets"];

    // Phase 1: Ensure every category with available articles gets at least TARGET_PER_CATEGORY
    // Sort categories: those with 0 published come first
    const sortedCategories = [...ALL_CATEGORIES].sort((a, b) =>
      (publishedCategoryCounts[a] || 0) - (publishedCategoryCounts[b] || 0)
    );

    for (const cat of sortedCategories) {
      const available = (byCategory[cat] || []).filter(a => !usedIds.has(a.id));
      const needed = TARGET_PER_CATEGORY - (publishedCategoryCounts[cat] || 0);
      const toTake = Math.max(0, Math.min(needed, available.length, MAX_TOTAL - selectedArticles.length));
      for (let i = 0; i < toTake; i++) {
        selectedArticles.push(available[i]);
        usedIds.add(available[i].id);
      }
    }

    // Phase 2: If we still have room, ask Claude to pick the best remaining articles
    if (selectedArticles.length < MAX_TOTAL) {
      const remaining = articles.filter(a => !usedIds.has(a.id));
      if (remaining.length > 0) {
        const selectionPrompt = customSelectionPrompt || DEFAULT_SELECTION_PROMPT;
        const articleList = remaining.map((a, i) =>
          `${i + 1}. [${a.category}] ${a.title}\n   Source: ${a.source_name}\n   Description: ${(a.description || "").slice(0, 150)}`
        ).join("\n\n");

        const spotsLeft = MAX_TOTAL - selectedArticles.length;
        try {
          const selectionResult = await callClaudeWithRetry(
            selectionPrompt,
            `Here are ${remaining.length} recent articles:\n\n${articleList}\n\nReturn ONLY a JSON array of the selected article numbers, e.g. [1, 3, 5, 7]. Select up to ${spotsLeft} articles maximum.`,
            500
          );

          let selectedIndices: number[];
          const jsonMatch = selectionResult.match(/\[[\d,\s]+\]/);
          selectedIndices = JSON.parse(jsonMatch?.[0] || "[]");

          for (const idx of selectedIndices) {
            if (selectedArticles.length >= MAX_TOTAL) break;
            const art = remaining[idx - 1];
            if (art && !usedIds.has(art.id)) {
              selectedArticles.push(art);
              usedIds.add(art.id);
            }
          }
        } catch (selErr) {
          console.error("Selection failed, using remaining by recency:", (selErr as Error).message);
          // Fallback: just add remaining by recency
          for (const art of remaining) {
            if (selectedArticles.length >= MAX_TOTAL) break;
            if (!usedIds.has(art.id)) {
              selectedArticles.push(art);
              usedIds.add(art.id);
            }
          }
        }
      }
    }

    console.log(`[Selection] ${selectedArticles.length} articles selected from ${articles.length} candidates. Categories: ${
      ALL_CATEGORIES.map(c => `${c}:${selectedArticles.filter(a => a.category === c).length}`).join(", ")
    }`);

    if (!selectedArticles.length) {
      return new Response(JSON.stringify({ success: true, message: "No articles selected", count: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Step 3: Scrape + Summarize each selected article
    const summaryPrompt = customSummaryPrompt || DEFAULT_SUMMARY_PROMPT;
    let summarized = 0;
    const results: { id: string; title: string; status: string }[] = [];
    const startTime = Date.now();
    const MAX_WALL_CLOCK_MS = 135000; // 135s hard limit (edge fn times out at 150s)

    for (const article of selectedArticles) {
      // Bail out if we're running out of time
      if (Date.now() - startTime > MAX_WALL_CLOCK_MS) {
        console.log(`[Timeout] Stopping after ${summarized} articles — wall clock limit reached`);
        results.push({ id: article.id, title: article.title, status: "skipped: timeout" });
        continue;
      }
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
        const summaryResult = await callClaudeWithRetry(
          summaryPrompt,
          `ARTICLE TITLE: ${article.title}\nSOURCE: ${article.source_name}\nCATEGORY: ${article.category}\n\nFULL ARTICLE CONTENT:\n${fullContent}`,
          2048
        );
        let parsed = robustParseJSON(summaryResult);
        // Clean parsed fields
        parsed.summary_en = cleanSummary(parsed.summary_en || parsed.summary || "");
        parsed.category = normalizeCategory(parsed.category || article.category || "");
        console.log("PARSED KEYS:", Object.keys(parsed), "EN length:", parsed.summary_en.length, "CAT:", parsed.category);

        // --- CALL 2: Translate to requested languages (only for EN articles with real summary) ---
        if (!isLocalLang && translateLangs.length > 0 && isValidSummary(parsed.summary_en)) {
          try {
            const transPrompt = buildTranslationPrompt(translateLangs);
            const transResult = await callClaudeWithRetry(
              transPrompt,
              `TITLE TO TRANSLATE: ${article.title}\n\nENGLISH SUMMARY TO TRANSLATE:\n\n${parsed.summary_en}`,
              4096
            );
            if (translateLangs.includes("fr")) {
              const frMatch = transResult.match(/"summary_fr"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:summary_it|summary_es|title_)|"\s*\})/);
              parsed.summary_fr = cleanSummary(frMatch?.[1] || "");
              const titleFrMatch = transResult.match(/"title_fr"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:title_|summary_)|"\s*\})/);
              parsed.title_fr = cleanSummary(titleFrMatch?.[1] || "");
            }
            if (translateLangs.includes("it")) {
              const itMatch = transResult.match(/"summary_it"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:summary_fr|summary_es|title_)|"\s*\})/);
              parsed.summary_it = cleanSummary(itMatch?.[1] || "");
              const titleItMatch = transResult.match(/"title_it"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:title_|summary_)|"\s*\})/);
              parsed.title_it = cleanSummary(titleItMatch?.[1] || "");
            }
            if (translateLangs.includes("es")) {
              const esMatch = transResult.match(/"summary_es"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:summary_fr|summary_it|title_)|"\s*\})/);
              parsed.summary_es = cleanSummary(esMatch?.[1] || "");
              const titleEsMatch = transResult.match(/"title_es"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"(?:title_|summary_)|"\s*\})/);
              parsed.title_es = cleanSummary(titleEsMatch?.[1] || "");
            }
            console.log("TRANS FR:", (parsed.summary_fr || "").length, "IT:", (parsed.summary_it || "").length, "ES:", (parsed.summary_es || "").length);
          } catch (transErr) {
            console.error("Translation failed:", (transErr as Error).message);
          }
        }

        // Determine the main summary text
        const mainSummary = isLocalLang ? (parsed[`summary_${targetLang}`] || parsed.summary_en) : parsed.summary_en;

        // Update article with summary — use null (not "") for empty summaries so articles can be retried
        const enSummary = isValidSummary(parsed.summary_en || "") ? parsed.summary_en : null;
        const frSummary = isLocalLang && targetLang === "fr"
          ? (parsed.summary_fr || parsed.summary_en || null)
          : (parsed.summary_fr || null);
        const itSummary = isLocalLang && targetLang === "it"
          ? (parsed.summary_it || parsed.summary_en || null)
          : (parsed.summary_it || null);
        const esSummary = isLocalLang && targetLang === "es"
          ? (parsed.summary_es || parsed.summary_en || null)
          : (parsed.summary_es || null);

        // --- Download image to Supabase Storage for permanent hosting ---
        const rawImageUrl = scrapedImageUrl3 || article.image_url || "";
        const storedImageUrl = rawImageUrl ? await downloadAndStoreImage(rawImageUrl, article.id) : "";

        const updateData: Record<string, any> = {
          full_content: fullContent.slice(0, 50000),
          image_url: storedImageUrl,
          category: parsed.category, // Ensure normalized category is saved
          title_en: article.title,
          title_fr: parsed.title_fr || "",
          title_it: parsed.title_it || "",
          title_es: parsed.title_es || "",
          is_published: isValidSummary(mainSummary || ""),
          is_featured: summarized === 0, // First article is featured
        };
        // Only write summary fields if they have real content (keep null for retry)
        if (enSummary) updateData.summary_en = enSummary;
        if (frSummary) updateData.summary_fr = frSummary;
        if (itSummary) updateData.summary_it = itSummary;
        if (esSummary) updateData.summary_es = esSummary;

        const { error: updateErr } = await supabase
          .from("news_articles")
          .update(updateData)
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

    // ─── STEP 4: Auto-select Top News ──────────────────────────────────
    // After summarizing, pick the 3-4 most important articles from today and mark as top_news
    let topNewsCount = 0;
    try {
      if (Date.now() - startTime < MAX_WALL_CLOCK_MS - 10000) {
        // Reset today's top news first
        await supabase
          .from("news_articles")
          .update({ is_top_news: false })
          .eq("is_top_news", true)
          .gte("published_at", todayStart.toISOString());

        // Get all published articles from today
        const { data: todaysArticles } = await supabase
          .from("news_articles")
          .select("id, title, category, summary_en")
          .eq("is_published", true)
          .gte("published_at", todayStart.toISOString())
          .order("published_at", { ascending: false })
          .limit(20);

        if (todaysArticles && todaysArticles.length >= 3) {
          const topNewsPrompt = `You are selecting the TOP 3-4 most important news stories for startup investors today.

Pick articles that:
- Have the highest impact on the startup/investment ecosystem
- Cover major events (big funding rounds, IPOs, market shifts, policy changes)
- Would be "must-read" for a busy investor

From these articles, return ONLY a JSON array of the selected article IDs.
Example: ["id1", "id2", "id3"]

Articles:
${todaysArticles.map(a => `ID: ${a.id}\nTitle: ${a.title}\nCategory: ${a.category}\nSummary: ${(a.summary_en || "").slice(0, 150)}\n`).join("\n")}

Return ONLY the JSON array of 3-4 IDs. No explanation.`;

          const topResult = await callClaudeWithRetry("Select top news articles.", topNewsPrompt, 500);
          const topIds = JSON.parse(topResult.match(/\[[\s\S]*?\]/)?.[0] || "[]");

          if (topIds.length > 0) {
            const { error: topErr } = await supabase
              .from("news_articles")
              .update({ is_top_news: true })
              .in("id", topIds.slice(0, 4));

            if (!topErr) topNewsCount = Math.min(topIds.length, 4);
            console.log(`[TopNews] Marked ${topNewsCount} articles as top news`);
          }
        }
      }
    } catch (topErr) {
      console.error("[TopNews] Auto-selection failed (non-fatal):", (topErr as Error).message);
    }

    return new Response(JSON.stringify({
      success: true,
      mode: "auto",
      analyzed: articles.length,
      selected: selectedArticles.length,
      summarized,
      top_news_selected: topNewsCount,
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

/** Build a dynamic translation prompt based on requested languages */
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
Return ONLY valid JSON:
{
${jsonFields.join(",\n")}
}
Return ONLY the JSON object, no markdown, no code blocks.`;
}

const TRANSLATION_PROMPT = buildTranslationPrompt(["fr", "it", "es"]);
