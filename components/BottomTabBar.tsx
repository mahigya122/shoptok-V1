import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

interface Tab {
  key: string;
  label: string;
  route: string;
}

const tabs: Tab[] = [
  { key: "home", label: "Home", route: "/(tabs)/home" },
  { key: "discover", label: "Discover", route: "/(tabs)/discover" },
  { key: "following", label: "Following", route: "/(tabs)/following" },
  { key: "for-you", label: "For You", route: "/(tabs)/for-you" },
  { key: "cart", label: "Cart", route: "/(tabs)/cart" },
  { key: "profile", label: "Profile", route: "/(tabs)/profile" }
];

interface BottomTabBarProps {
  navigation: any; // You can refine this with proper React Navigation types if desired
}

export default function BottomTabBar({ navigation }: BottomTabBarProps) {
  return (
    <SafeAreaView edges={["bottom"]} style={styles.safe}>
      <View style={styles.bar}>
        {tabs.map(t => (
          <Pressable 
            key={t.key} 
            onPress={() => navigation.navigate(t.route)} 
            style={styles.tab} 
            android_ripple={{ color: '#ffffff10' }}
          >
            <Text style={styles.label}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: "#0b0b0b" },
  bar: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: "#0b0b0b" },
  tab: { paddingHorizontal: 12, paddingVertical: 6, minWidth: 56, alignItems: 'center' },
  label: { color: colors.text, fontSize: 12 }
});
