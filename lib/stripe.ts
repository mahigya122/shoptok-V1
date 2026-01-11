import { initStripe } from "@stripe/stripe-react-native";

export const initStripeClient = async () => {
  await initStripe({
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  });
};
