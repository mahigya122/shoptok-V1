import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { requestEmailOtp, verifyEmailOtp } from "../services/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;

    setLoading(true);
    setError(null);
    try {
      await requestEmailOtp(normalizedEmail);
      setStep("code");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const normalizedEmail = email.trim();
    const normalizedCode = code.replace(/\s+/g, "").trim();
    if (!normalizedEmail || !normalizedCode) return;

    setLoading(true);
    setError(null);
    try {
      await verifyEmailOtp(normalizedEmail, normalizedCode);
      // Root auth guard should redirect automatically, but we also force it for instant UX.
      router.replace("/(tabs)/home");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: spacing.md, justifyContent: "center" }}>
      <Text style={styles.title}>Welcome to Shoptok</Text>

      {step === "email" ? (
        <>
          <Text style={styles.body}>Enter your email to get a 6‑digit code</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={sendCode} disabled={loading}>
            {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.btnText}>Send code</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.body}>Enter the code sent to {email.trim() || "your email"}</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            style={styles.input}
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={12}
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={verifyCode} disabled={loading}>
            {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.btnText}>Verify & continue</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary, loading && styles.btnDisabled]}
            onPress={sendCode}
            disabled={loading}
          >
            <Text style={styles.btnSecondaryText}>Resend code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary, loading && styles.btnDisabled]}
            onPress={() => {
              setCode("");
              setStep("email");
            }}
            disabled={loading}
          >
            <Text style={styles.btnSecondaryText}>Use different email</Text>
          </TouchableOpacity>
        </>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: spacing.md },
  body: { color: colors.textMuted, marginBottom: spacing.sm },
  input: { backgroundColor: colors.surface, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.md },
  btn: { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#111", fontWeight: "700", textAlign: "center" },
  btnSecondary: { backgroundColor: "transparent", borderColor: colors.border },
  btnSecondaryText: { color: colors.text, fontWeight: "700", textAlign: "center" },
  error: { marginTop: spacing.sm, color: "#ff6b6b" },
});
