import React from "react";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { Text, TouchableOpacity, View, ActivityIndicator, StyleSheet } from "react-native";

export const Title = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>{children}</Text>
);

export const Body = ({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) => (
  <Text style={{ color: muted ? colors.textMuted : colors.text, fontSize: 14 }}>{children}</Text>
);

export const Button = ({ label, onPress, variant = "primary" }: { label: string; onPress: () => void; variant?: "primary" | "ghost" }) => (
  <TouchableOpacity onPress={onPress} style={[styles.btn, variant === "ghost" ? styles.btnGhost : styles.btnPrimary]}>
    <Text style={variant === "ghost" ? styles.btnGhostText : styles.btnPrimaryText}>{label}</Text>
  </TouchableOpacity>
);

export const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.card}>{children}</View>
);

export const Loader = () => <ActivityIndicator color={colors.primary} />;

const styles = StyleSheet.create({
  btn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: 12, borderWidth: 1 },
  btnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnGhost: { backgroundColor: "transparent", borderColor: colors.border },
  btnPrimaryText: { color: "#111", fontWeight: "700" },
  btnGhostText: { color: colors.text },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: colors.border }
});
