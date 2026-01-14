import React from "react";
import { View, Text } from "react-native";
import { colors } from "../constants/colors";
import { Link } from "expo-router";

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 8 }}>
        Page not found
      </Text>
      <Text style={{ color: colors.textMuted, textAlign: "center", marginBottom: 16 }}>
        This route doesn’t exist.
      </Text>
      <Link href="/(tabs)/home" style={{ color: colors.primary, fontWeight: "700" }}>
        Go to Home
      </Link>
    </View>
  );
}
