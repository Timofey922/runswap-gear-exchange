import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { activities, athlete_gear } = await req.json();

    // Fetch available listings from Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: listings, error } = await supabase
      .from("listings")
      .select("id, title, brand, model, category, size, condition, mileage, price, description")
      .eq("sold", false)
      .limit(100);

    if (error) throw error;

    const prompt = `You are a running gear advisor for PaceMarket marketplace. Analyze this runner's Strava data and recommend the best matching listings.

RUNNER'S STRAVA DATA:
- Recent activities: ${JSON.stringify(activities?.slice(0, 10))}
- Gear: ${JSON.stringify(athlete_gear)}

AVAILABLE LISTINGS:
${JSON.stringify(listings)}

Return a JSON array of recommendations. Each item must have:
- "listing_id": the id from the listings
- "reason": a short one-line explanation of why this listing fits the runner's profile

Consider: weekly mileage, pace, terrain, current gear wear, running style. Return up to 5 best matches. Return ONLY valid JSON array, no markdown.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a running gear recommendation engine. Always return valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content ?? "[]";

    // Parse AI response - strip markdown code fences if present
    let recommendations;
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      recommendations = JSON.parse(cleaned);
    } catch {
      recommendations = [];
    }

    // Enrich recommendations with listing data
    const enriched = recommendations
      .filter((r: any) => r.listing_id)
      .map((r: any) => {
        const listing = listings?.find((l: any) => l.id === r.listing_id);
        return listing ? { ...listing, reason: r.reason } : null;
      })
      .filter(Boolean);

    return new Response(JSON.stringify({ recommendations: enriched }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
