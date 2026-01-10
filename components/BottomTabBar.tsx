import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

const tabs = [
  { key: "home", label: "Home" },
  { key: "discover", label: "Discover" },
  { key: "following", label: "Following" },
  { key: "for-you", label: "For You" },
  { key: "cart", label: "Cart" },
  { key: "profile", label: "Profile" }
];

export default function BottomTabBar({ state, navigation }: any) {
  const activeRouteName = state.routes[state.index].name;

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
      <View style={styles.bar}>
        {tabs.map(t => {
          const isActive = activeRouteName === t.key;
          return (
            <Pressable key={t.key} onPress={() => navigation.navigate(t.key)} style={styles.tab} android_ripple={{ color: '#ffffff10' }}>
              <Text style={[styles.label, isActive && styles.labelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: "#0b0b0b" },
  bar: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: "#0b0b0b" },
  tab: { paddingHorizontal: 12, paddingVertical: 6, minWidth: 56, alignItems: 'center' },
  label: { color: colors.textMuted, fontSize: 12 },
  labelActive: { color: colors.primary, fontWeight: 'bold' }
});
