import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { useCartStore } from "../store/cartStore";
import { useUserStore } from "../store/userStore";
import { Platform } from "react-native";

// Stripe native functions are only available on native platforms. Import dynamically at runtime.
let initPaymentSheet: any = async () => ({ error: { code: 'not_available', message: 'Stripe not available on web' } });
let presentPaymentSheet: any = async () => ({ error: { code: 'not_available', message: 'Stripe not available on web' } });
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const stripe = require('@stripe/stripe-react-native');
    initPaymentSheet = stripe.initPaymentSheet;
    presentPaymentSheet = stripe.presentPaymentSheet;
  } catch (e) {
    console.warn('Stripe native module not available:', e?.message ?? e);
  }
}
import { createOrder } from "../services/api";

export default function CheckoutScreen() {
  const items = useCartStore((s) => s.items);
  const userId = useUserStore((s) => s.userId);
  const [ready, setReady] = useState(false);
  const total = items.reduce((sum, i) => sum + (Number(i.unit_price) || 0) * (i.quantity || 0), 0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      // Only set up payment when there's something to pay for and user is logged in
      if (!userId || total <= 0) {
        setReady(false);
        return;
      }

      try {
        const recommendUrl = process.env.RECOMMENDATION_FUNCTION_URL;
        if (!recommendUrl) {
          console.warn("RECOMMENDATION_FUNCTION_URL is not set");
          return;
        }
        const paymentIntentUrl = recommendUrl.replace("recommend", "create-payment-intent");
        const res = await fetch(paymentIntentUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(total * 100), currency: "usd" })
        });

        if (!res.ok) {
          console.warn("create-payment-intent failed", await res.text());
          return;
        }

        const { paymentIntent, ephemeralKey, customer } = await res.json();
        if (!paymentIntent) {
          console.warn("no paymentIntent returned");
          return;
        }

          const { error } = await initPaymentSheet({
          merchantDisplayName: "Shoptok",
          customerId: customer,
          customerEphemeralKeySecret: ephemeralKey,
          paymentIntentClientSecret: paymentIntent,
          defaultBillingDetails: { address: { country: "US" } }
        });

        if (mounted && !error) setReady(true);

        // Optionally create an order record now; only do so if we have a paymentIntent and a user
      } catch (err) {
        console.warn("Payment setup failed", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [total, userId]);

  const pay = async () => {
    try {
      const { error } = await presentPaymentSheet();
      if (error) {
        console.warn("Payment failed", error);
      } else {
        if (userId) {
          try {
            await createOrder(userId, total, "USD", "paid");
          } catch (e) {
            console.warn("createOrder failed", e);
          }
        }
        // Success handled by Stripe webhook; optionally navigate to success screen
      }
    } catch (err) {
      console.warn("presentPaymentSheet error", err);
    }
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
      <TouchableOpacity style={[styles.btn, { opacity: ready ? 1 : 0.5 }]} onPress={pay} disabled={!ready}>
        <Text style={styles.btnText}>Pay</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  total: { color: colors.primary, fontWeight: "700", fontSize: 18, marginTop: spacing.md },
  btn: { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1, borderRadius: 12, padding: spacing.sm, marginTop: spacing.lg },
  btnText: { color: "#111", fontWeight: "700", textAlign: "center" }
});
