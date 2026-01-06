import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { signInWithOtp } from "../services/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    await signInWithOtp(email);
    setSent(true);
  };

  return (
    <View style={{ flex: 1, padding: spacing.md, justifyContent: "center" }}>
      <Text style={styles.title}>Welcome to Shoptok</Text>
      <Text style={styles.body}>Sign in with email to continue</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" />
      <TouchableOpacity style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>{sent ? "Check your email" : "Send magic link"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: spacing.md },
  body: { color: colors.textMuted, marginBottom: spacing.sm },
  input: { backgroundColor: colors.surface, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.md },
  btn: { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1, borderRadius: 12, padding: spacing.sm },
  btnText: { color: "#111", fontWeight: "700", textAlign: "center" }
});
