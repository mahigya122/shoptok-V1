import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

// NOTE: Keep all secret logic on the Edge Function. The app should call
// this endpoint and receive only the client secret.

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  try {
    const { amount, currency = "usd" } = await req.json();

    if (!amount || typeof amount !== "number") {
      return new Response(JSON.stringify({ error: "Missing or invalid `amount`" }), { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Deno logs are available in Supabase function logs
    console.error('create-payment-intent error', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
});
