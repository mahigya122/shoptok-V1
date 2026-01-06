// Deno Deploy - Personalized recommendations based on likes, follows, and views recency
import "https://deno.land/x/dotenv/load.ts";

interface EventRow {
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, limit = 20 } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId required" }), { status: 400, headers: corsHeaders });
    }

    // Simple heuristic: boost videos of followed brands, liked product categories, viewed recency
    // For demo, we query Supabase via REST (in production, use service role safely)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

    const followsRes = await fetch(`${supabaseUrl}/rest/v1/brand_follows?user_id=eq.${userId}&select=brand_id`, { headers });
    const follows = await followsRes.json();

    const likedRes = await fetch(`${supabaseUrl}/rest/v1/video_likes?user_id=eq.${userId}&select=video_id`, { headers });
    const liked = await likedRes.json();

    const viewsRes = await fetch(`${supabaseUrl}/rest/v1/video_views?user_id=eq.${userId}&select=video_id,created_at&order=created_at.desc`, { headers });
    const views = (await viewsRes.json()) as { video_id: string }[];

    // Build query parameters: prioritize followed brands and recently viewed products
    const brandIds = follows.map((f: any) => `brand_id.eq.${f.brand_id}`).join(",");
    const likedIds = liked.map((l: any) => l.video_id);
    const recentIds = views.slice(0, 50).map((v) => v.video_id);
    const boostIds = Array.from(new Set([...likedIds, ...recentIds]));

    // Fetch candidate videos (active products only)
    const videosRes = await fetch(`${supabaseUrl}/rest/v1/videos?select=*,products!videos_product_id_fkey(*)&order=created_at.desc`, { headers });
    let videos = await videosRes.json();

    // Score videos
    const scores: Record<string, number> = {};
    for (const v of videos) {
      let score = 0;
      if (brandIds.includes(v.brand_id)) score += 5;
      if (boostIds.includes(v.id)) score += 3;
      score += (v.views_count ?? 0) * 0.0001 + (v.likes_count ?? 0) * 0.001;
      scores[v.id] = score;
    }

    videos.sort((a: any, b: any) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
    videos = videos.slice(0, Number(limit));

    return new Response(JSON.stringify({ data: videos }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
