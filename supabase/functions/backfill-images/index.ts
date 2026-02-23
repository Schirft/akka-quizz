/**
 * Edge Function: backfill-images
 *
 * One-time utility to migrate existing news article images from external hotlinks
 * to Supabase Storage. Processes articles in batches of 10.
 *
 * DEPLOYMENT:
 *   supabase functions deploy backfill-images --no-verify-jwt
 *
 * USAGE:
 *   curl -X POST .../functions/v1/backfill-images -H "Authorization: Bearer ..."
 *   Optional body: { "batchSize": 10 }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function downloadAndStoreImage(imageUrl: string, articleId: string): Promise<string> {
  if (!imageUrl || imageUrl.includes("supabase.co/storage")) return imageUrl;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AkkaBot/1.0)",
        "Accept": "image/*",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return imageUrl;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return imageUrl;

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength < 1000 || arrayBuffer.byteLength > 10_000_000) return imageUrl;

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
      "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
    };
    const ext = extMap[contentType] || "jpg";
    const fileName = `${articleId}.${ext}`;

    const { error } = await supabase.storage
      .from("news-images")
      .upload(fileName, arrayBuffer, { contentType, upsert: true });

    if (error) return imageUrl;

    const { data: urlData } = supabase.storage
      .from("news-images")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch {
    return imageUrl;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let batchSize = 10;
    try {
      const body = await req.json();
      batchSize = body.batchSize || 10;
    } catch {}

    // Get published articles with external image URLs (not yet migrated)
    const { data: articles, error: fetchErr } = await supabase
      .from("news_articles")
      .select("id, image_url")
      .eq("is_published", true)
      .not("image_url", "is", null)
      .not("image_url", "eq", "")
      .not("image_url", "like", "%supabase.co/storage%")
      .order("published_at", { ascending: false })
      .limit(batchSize);

    if (fetchErr || !articles?.length) {
      return new Response(JSON.stringify({
        success: true,
        message: "No articles to backfill",
        remaining: 0,
      }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    let migrated = 0;
    let failed = 0;
    const startTime = Date.now();

    for (const article of articles) {
      // Stop if running out of time (140s limit)
      if (Date.now() - startTime > 140000) break;

      const newUrl = await downloadAndStoreImage(article.image_url, article.id);
      if (newUrl !== article.image_url && newUrl.includes("supabase.co/storage")) {
        const { error: updateErr } = await supabase
          .from("news_articles")
          .update({ image_url: newUrl })
          .eq("id", article.id);
        if (!updateErr) migrated++;
        else failed++;
      } else {
        failed++;
      }
    }

    // Count remaining
    const { count } = await supabase
      .from("news_articles")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .not("image_url", "is", null)
      .not("image_url", "eq", "")
      .not("image_url", "like", "%supabase.co/storage%");

    return new Response(JSON.stringify({
      success: true,
      processed: articles.length,
      migrated,
      failed,
      remaining: count || 0,
      elapsed_ms: Date.now() - startTime,
    }), { headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
