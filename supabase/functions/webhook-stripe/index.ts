import "https://deno.land/x/dotenv/load.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-11-20.acacia" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const sig = req.headers.get("stripe-signature")!;
    const rawBody = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      // Save order status using Service Role
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Content-Type": "application/json" };

      // Find existing order by payment intent id
      const { data: orders } = await (await fetch(`${supabaseUrl}/rest/v1/orders?stripe_payment_intent_id=eq.${pi.id}&select=id,user_id`, { headers })).json();
      // If not found, create or update; here we upsert via RPC or REST
      await fetch(`${supabaseUrl}/rest/v1/orders?stripe_payment_intent_id=eq.${pi.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "paid", amount_total: (pi.amount_received ?? 0) / 100, currency: pi.currency.toUpperCase() })
      });
    }

    return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: corsHeaders });
  }
});
