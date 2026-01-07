import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { colors } from "../constants/colors";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { supabase } from "../services/api";
import ErrorBoundary from "../components/ErrorBoundary";
import Constants from "expo-constants";
import { Platform } from 'react-native';

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

  const router = useRouter();

  // ❌ Not logged in → programmatic redirect to login
  useEffect(() => {
    if (!loading && !user) {
      try {
        router.replace("/login");
      } catch (e) {
        // ignore
      }
    }
  }, [loading, user, router]);
  if (!user) {
    return null;
  }

  // ✅ Logged in → show app (UNCHANGED STRUCTURE)
  const extras = (Constants.expoConfig && (Constants.expoConfig.extra || {})) || (Constants.manifest && Constants.manifest.extra) || {};
  const stripeKey = extras.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // Normalize `Stack` in case the router export is wrapped under a `.default` property
  const StackComponent: any = (Stack && typeof Stack === 'object' && 'default' in Stack) ? (Stack as any).default : Stack;
  // Debugging: log a tiny summary if something is unexpected
  try {
    // eslint-disable-next-line no-console
    console.log('DEBUG Layout:', { StackIsFunction: typeof StackComponent === 'function', StackKeys: Stack && typeof Stack === 'object' ? Object.keys(Stack) : null });
  } catch (e) {}

  // Load StripeProvider only on native platforms to avoid importing native-only modules on web.
  let StripeProviderComp: any = ({ children }: any) => children;
  if (Platform.OS !== 'web') {
    try {
      // require dynamically so bundlers don't include native-only code for web
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@stripe/stripe-react-native');
      StripeProviderComp = mod?.StripeProvider ?? StripeProviderComp;
    } catch (e) {
      // if stripe isn't installed for native env, ignore — app can run without payments in dev
      console.warn('Stripe native module not available:', e?.message ?? e);
    }
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StripeProviderComp publishableKey={stripeKey || ""}>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1 }}>
              <StackComponent
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                }}
              />
            </View>
          </SafeAreaView>
        </StripeProviderComp>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingText: { marginTop: 12, color: colors.textMuted },
});
