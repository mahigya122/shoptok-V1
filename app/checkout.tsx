import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { useCartStore } from "../store/cartStore";
import { useUserStore } from "../store/userStore";
import { createOrder } from "../services/api";

/**
 * Stripe native functions are only available on iOS / Android.
 * On web we provide safe fallbacks.
 */
type StripeResult = { error?: { code?: string; message?: string } };

let initPaymentSheet: (config: any) => Promise<StripeResult> = async () => ({
  error: { code: "not_available", message: "Stripe not available on web" },
});

let presentPaymentSheet: () => Promise<StripeResult> = async () => ({
  error: { code: "not_available", message: "Stripe not available on web" },
});

if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const stripe = require("@stripe/stripe-react-native");
    initPaymentSheet = stripe.initPaymentSheet;
    presentPaymentSheet = stripe.presentPaymentSheet;
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.warn("Stripe native module not available:", e.message);
    } else {
      console.warn("Stripe native module not available:", e);
    }
  }
}

export default function CheckoutScreen() {
  const items = useCartStore((s) => s.items);
  const userId = useUserStore((s) => s.userId);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = items.reduce(
    (sum, i) => sum + (Number(i.unit_price) || 0) * (i.quantity || 0),
    0
  );

  /**
   * Initialize Stripe Payment Sheet
   */
  useEffect(() => {
    let mounted = true;

    const setupPayment = async () => {
      if (!userId || total <= 0) {
        setReady(false);
        return;
      }

      try {
        const baseUrl = process.env.RECOMMENDATION_FUNCTION_URL;
        if (!baseUrl) {
          console.warn("RECOMMENDATION_FUNCTION_URL is not set");
          return;
        }

        const paymentIntentUrl = baseUrl.replace(
          "recommend",
          "create-payment-intent"
        );

        const res = await fetch(paymentIntentUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            currency: "usd",
          }),
        });

        if (!res.ok) {
          console.warn("create-payment-intent failed", await res.text());
          return;
        }

        const { paymentIntent, ephemeralKey, customer } = await res.json();

        if (!paymentIntent || !customer || !ephemeralKey) {
          console.warn("Invalid payment intent response");
          return;
        }

        const { error } = await initPaymentSheet({
          merchantDisplayName: "Shoptok",
          customerId: customer,
          customerEphemeralKeySecret: ephemeralKey,
          paymentIntentClientSecret: paymentIntent,
          defaultBillingDetails: {
            address: { country: "US" },
          },
        });

        if (mounted && !error) {
          setReady(true);
        } else if (error) {
          console.warn("initPaymentSheet error:", error.message);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.warn("Payment setup failed:", err.message);
        } else {
          console.warn("Payment setup failed:", err);
        }
      }
    };

    setupPayment();

    return () => {
      mounted = false;
    };
  }, [total, userId]);

  /**
   * Handle payment
   */
  const pay = useCallback(async () => {
    if (!ready || loading) return;

    setLoading(true);

    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        console.warn("Payment failed:", error.message);
        return;
      }

      if (userId) {
        try {
          await createOrder(userId, total, "USD", "paid");
        } catch (e: unknown) {
          if (e instanceof Error) {
            console.warn("createOrder failed:", e.message);
          } else {
            console.warn("createOrder failed:", e);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.warn("presentPaymentSheet error:", err.message);
      } else {
        console.warn("presentPaymentSheet error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [ready, loading, total, userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>

      <TouchableOpacity
        style={[
          styles.btn,
          { opacity: ready && !loading ? 1 : 0.5 },
        ]}
        onPress={pay}
        disabled={!ready || loading}
      >
        <Text style={styles.btnText}>
          {loading ? "Processing..." : "Pay"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  total: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 18,
    marginTop: spacing.md,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: spacing.lg,
  },
  btnText: {
    color: "#111",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
  },
});
