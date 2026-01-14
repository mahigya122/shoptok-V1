import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/colors";
import { supabase } from "../../lib/supabaseClient";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();

  const [status, setStatus] = useState<"working" | "error">("working");
  const [message, setMessage] = useState<string>("Signing you in…");

  useEffect(() => {
    let mounted = true;

    async function handleUrl(incomingUrl: string | null) {
      if (!incomingUrl) return;

      try {
        // For PKCE / magic-link flows, Supabase encodes the auth code in the URL.
        // This exchanges it for a session and triggers onAuthStateChange.
        const { error } = await supabase.auth.exchangeCodeForSession(incomingUrl);
        if (error) throw error;

        if (!mounted) return;
        router.replace("/(tabs)/home");
      } catch (e: unknown) {
        if (!mounted) return;
        setStatus("error");
        setMessage(e instanceof Error ? e.message : String(e));
      }
    }

    // Handle initial open and any subsequent url events.
    Linking.getInitialURL().then(handleUrl).catch(() => {
      // ignore
    });
    handleUrl(url);

    return () => {
      mounted = false;
    };
  }, [router, url]);

  return (
    <View style={styles.container}>
      {status === "working" ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>{message}</Text>
        </>
      ) : (
        <>
          <Text style={[styles.text, styles.errorTitle]}>Sign-in failed</Text>
          <Text style={styles.text}>{message}</Text>
          <Text style={[styles.text, styles.hint]}>
            Go back to the app and try requesting a new magic link.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  text: {
    color: colors.text,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  hint: {
    color: colors.textMuted,
  },
});
