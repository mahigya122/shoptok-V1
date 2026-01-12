// app/_layout.tsx
import React, { useEffect, useState, ReactNode } from "react";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, Text, StyleSheet, View, Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

import { supabase } from "../lib/supabaseClient";
import { colors } from "../constants/colors";
import type { Session, User } from "@supabase/supabase-js";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};
type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) { return { hasError: true }; }
  componentDidCatch(error: Error, info: any) { console.error("Uncaught error:", error, info); }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <View style={styles.errorFallback}>
          <Text style={styles.errorText}>Something went wrong.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

type StripeProviderProps = { children: ReactNode; publishableKey?: string };
let StripeProviderComp: React.FC<StripeProviderProps> = ({ children }) => <>{children}</>;

if (Platform.OS !== "web") {
  try {
    const mod = require("@stripe/stripe-react-native");
    if (mod?.StripeProvider) StripeProviderComp = mod.StripeProvider;
  } catch (e: any) {
    console.warn("Stripe native module not available:", e?.message);
  }
}

export default function RootLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => { mounted = false; subscription?.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user]);

  if (loading || !user) return (
    <SafeAreaView style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading…</Text>
    </SafeAreaView>
  );

  const extras = Constants.expoConfig?.extra ?? (Constants.manifest as any)?.extra ?? {};
  const stripeKey = extras.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

  return (
    <SafeAreaProvider>
      <ErrorBoundary fallback={
        <View style={styles.errorFallback}>
          <Text style={styles.errorText}>Oops! Something went wrong.</Text>
        </View>
      }>
        <StripeProviderComp publishableKey={stripeKey}>
          <SafeAreaView style={styles.container}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
          </SafeAreaView>
        </StripeProviderComp>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  loadingText: { marginTop: 12, color: colors.textMuted },
  errorFallback: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, padding: 16 },
  errorText: { fontSize: 18, color: colors.primary, fontWeight: "700", textAlign: "center" },
});
