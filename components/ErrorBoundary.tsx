import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  error?: Error | null;
};

export default function ErrorBoundary({ error }: Props) {
  if (!error) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>

      {/* ✅ fix: convert null → undefined */}
      <Text style={styles.message}>
        {error.message ?? undefined}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#330000",
    borderRadius: 12,
    margin: 16,
  },
  title: {
    color: "#ff8080",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  message: {
    color: "#ffd6d6",
    fontSize: 14,
  },
});
