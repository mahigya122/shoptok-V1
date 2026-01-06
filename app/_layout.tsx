import React, { useEffect, useState } from "react";
import { Stack, Redirect } from "expo-router";
import { colors } from "../constants/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { supabase } from "../services/api";
import ErrorBoundary from "../components/ErrorBoundary";
import Constants from "expo-constants";
import { StripeProvider } from '@stripe/stripe-react-native';

export default function Layout() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    // Get current user
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn("supabase.getUser error", error);
          setUser(null);
        } else {
          setUser(data?.user ?? null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to get user", err);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      try {
        // guard in case listener is undefined
        (listener as any)?.subscription?.unsubscribe?.();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  // ⏳ Wait until auth state is known
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  // ❌ Not logged in → redirect to login
  if (!user) {
    return <Redirect href="/login" />;
  }

  // ✅ Logged in → show app (UNCHANGED STRUCTURE)
  const extras = (Constants.expoConfig && (Constants.expoConfig.extra || {})) || (Constants.manifest && Constants.manifest.extra) || {};
  const stripeKey = extras.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  return (
    <ErrorBoundary>
      <StripeProvider publishableKey={stripeKey || ""}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            />
          </View>
        </SafeAreaView>
      </StripeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingText: { marginTop: 12, color: colors.textMuted },
});
