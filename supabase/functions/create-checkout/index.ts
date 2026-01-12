// supabase/functions/create-checkout/index.ts
// @ts-nocheck
import Stripe from "https://esm.sh/stripe@13.11.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------- STRIPE ----------------
const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY") ?? "",
  {
    apiVersion: "2022-11-15",
  }
);

// ---------------- SUPABASE ----------------
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// ---------------- EDGE FUNCTION ----------------
export default async function handler(req: Request): Promise<Response> {
  try {
    const { cart_id, user_id } = await req.json();

    if (!cart_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing cart_id or user_id" }),
        { status: 400 }
      );
    }

    const { data: cartItems, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        quantity,
        unit_price,
        product:products (
          title,
          images
        )
      `)
      .eq("cart_id", cart_id);

    if (error || !cartItems || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: "Cart is empty or invalid" }),
        { status: 400 }
      );
    }

    const line_items = cartItems.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product.title,
          images: item.product.images?.[0]
            ? [item.product.images[0].url]
            : [],
        },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${Deno.env.get("FRONTEND_URL")}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("FRONTEND_URL")}/checkout-cancelled`,
      metadata: {
        user_id,
        cart_id,
      },
    });

    return new Response(
      JSON.stringify({ checkout_url: session.url }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create checkout session" }),
      { status: 500 }
    );
  }
}
