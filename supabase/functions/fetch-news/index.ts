/**
 * Edge Function: fetch-news
 *
 * Fetches startup/VC news from GNews API and upserts into news_articles table.
 * Runs on a schedule (cron) or can be invoked manually.
 *
 * ─── DEPLOYMENT ───────────────────────────────────────────────
 *   supabase functions deploy fetch-news --no-verify-jwt
 *
 * ─── CRON SCHEDULE (add via Supabase Dashboard > Database > pg_cron) ──
 *   SELECT cron.schedule(
 *     'fetch-news-daily',
 *     '0 7 * * *',  -- every day at 7:00 UTC
 *     $$
 *     SELECT net.http_post(
 *       url := 'https://tpkeqwmbjjycgmrwtidc.supabase.co/functions/v1/fetch-news',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
 *       ),
 *       body := '{}'::jsonb
 *     );
 *     $$
 *   );
 *
 * ─── ENVIRONMENT VARIABLES (set in Supabase Dashboard) ────────
 *   GNEWS_API_KEY = 53798e3ace1583384a27a73cdfb2bd19
 *   SUPABASE_URL = (auto-set)
 *   SUPABASE_SERVICE_ROLE_KEY = (auto-set)
 * ──────────────────────────────────────────────────────────────
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GNEWS_API_KEY = Deno.env.get("GNEWS_API_KEY") || "53798e3ace1583384a27a73cdfb2bd19";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const CATEGORIES = ["startup", "vc", "fintech", "ai", "crypto", "deeptech"];
const LANGUAGES = [
  { code: "en", gnewsLang: "en" },
  { code: "fr", gnewsLang: "fr" },
  { code: "it", gnewsLang: "it" },
  { code: "es", gnewsLang: "es" },
];

const CATEGORY_QUERIES: Record<string, Record<string, string>> = {
  startup: {
    en: "startup OR startups OR unicorn",
    fr: "startup OR startups OR licorne OR levée de fonds",
    it: "startup OR startups OR unicorno OR raccolta fondi",
    es: "startup OR startups OR unicornio OR ronda de financiación",
  },
  vc: {
    en: "venture capital OR seed funding OR series A",
    fr: "capital-risque OR fonds investissement OR série A",
    it: "venture capital OR capitale di rischio OR serie A",
    es: "capital riesgo OR inversión OR serie A",
  },
  fintech: {
    en: "fintech OR neobank OR digital payments",
    fr: "fintech OR néobanque OR paiement numérique",
    it: "fintech OR neobanca OR pagamenti digitali",
    es: "fintech OR neobanco OR pagos digitales",
  },
  ai: {
    en: "artificial intelligence OR machine learning OR LLM OR OpenAI OR Anthropic",
    fr: "intelligence artificielle OR IA OR apprentissage automatique OR OpenAI",
    it: "intelligenza artificiale OR IA OR apprendimento automatico OR OpenAI",
    es: "inteligencia artificial OR IA OR aprendizaje automático OR OpenAI",
  },
  crypto: {
    en: "cryptocurrency OR blockchain OR web3 OR bitcoin",
    fr: "cryptomonnaie OR blockchain OR bitcoin OR crypto",
    it: "criptovaluta OR blockchain OR bitcoin OR crypto",
    es: "criptomoneda OR blockchain OR bitcoin OR crypto",
  },
  deeptech: {
    en: "quantum computing OR biotech OR climate tech OR space tech OR nuclear fusion OR robotics startup",
    fr: "biotech OR quantique OR technologie spatiale OR fusion nucléaire OR robotique startup OR deeptech",
    it: "biotech OR quantistico OR tecnologia spaziale OR fusione nucleare OR robotica startup OR deeptech",
    es: "biotech OR cuántica OR tecnología espacial OR fusión nuclear OR robótica startup OR deeptech",
  },
};

/** Rate-limit helper: wait 1 second between calls */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (_req: Request) => {
  // Handle CORS preflight
  if (_req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const lang of LANGUAGES) {
    for (const cat of CATEGORIES) {
      const query = CATEGORY_QUERIES[cat][lang.gnewsLang] || CATEGORY_QUERIES[cat]["en"];
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${lang.gnewsLang}&max=5&apikey=${GNEWS_API_KEY}`;

      try {
        const res = await fetch(url);
        if (!res.ok) {
          errors.push(`GNews ${lang.code}/${cat}: HTTP ${res.status}`);
          await sleep(1000);
          continue;
        }

        const data = await res.json();
        const articles = data.articles || [];

        for (const article of articles) {
          const payload = {
            title: article.title,
            description: article.description || null,
            content: article.content || null,
            source_name: article.source?.name || null,
            source_url: article.url,
            image_url: article.image || null,
            language: lang.code,
            category: cat,
            published_at: article.publishedAt || new Date().toISOString(),
            is_active: true,
            is_featured: false,
          };

          // Upsert by source_url (unique constraint)
          const { error: upsertErr } = await supabase
            .from("news_articles")
            .upsert(payload, { onConflict: "source_url", ignoreDuplicates: true });

          if (upsertErr) {
            totalSkipped++;
          } else {
            totalInserted++;
          }
        }
      } catch (err) {
        errors.push(`GNews ${lang.code}/${cat}: ${(err as Error).message}`);
      }

      // Rate limit: 1 request per second
      await sleep(1000);
    }
  }

  // Auto-feature the latest article per language
  for (const lang of LANGUAGES) {
    // Unfeature all
    await supabase
      .from("news_articles")
      .update({ is_featured: false })
      .eq("language", lang.code)
      .eq("is_featured", true);

    // Feature the latest
    const { data: latest } = await supabase
      .from("news_articles")
      .select("id")
      .eq("language", lang.code)
      .eq("is_active", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      await supabase
        .from("news_articles")
        .update({ is_featured: true })
        .eq("id", latest.id);
    }
  }

  // Delete articles older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("news_articles")
    .delete()
    .lt("published_at", sevenDaysAgo);

  return new Response(
    JSON.stringify({
      success: true,
      inserted: totalInserted,
      skipped: totalSkipped,
      errors,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
