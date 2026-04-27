// AI Stylist Chat — streaming Lovable AI gateway with catalog context
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build catalog snapshot for grounding
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await supabase
      .from("products")
      .select("name, slug, fabric, price, sale_price, sizes, description")
      .limit(40);

    const catalog = (products ?? [])
      .map(
        (p: any) =>
          `• ${p.name} (/product/${p.slug}) — ${p.fabric ?? "—"}, PKR ${p.sale_price ?? p.price}, sizes: ${p.sizes?.join("/")}`
      )
      .join("\n");

    const system = `You are Layla, the AI stylist for Zaineen Clothing, a luxury Pakistani women's fashion atelier (lawn, pret, festive, bridal).
Tone: warm, refined, knowledgeable, brief. Use elegant fashion language without being verbose.

You can:
- Recommend specific pieces from the catalog below (always cite as a markdown link [Name](/product/slug))
- Suggest sizing (S/M/L/XL — typical fit advice; advise sizing up for relaxed silhouettes)
- Style outfits for occasions (mehndi, nikkah, valima, eid, day, evening)
- Answer FAQs: shipping (free over PKR 25,000, ~3-5 days local, international available),
  returns (7-day window, unworn), care (dry clean only), payments (COD + card).

If a question is outside fashion / Zaineen Clothing, gently redirect.

CATALOG:
${catalog || "(catalog loading)"}

Format responses with short paragraphs and product links. Keep replies under 120 words unless the user asks for more detail.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached, please wait a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("stylist-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
