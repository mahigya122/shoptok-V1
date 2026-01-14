import { Tabs } from "expo-router";
import React from "react";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

/* eslint-disable react/display-name */

// TabBarIconProps matches what Expo Router expects
type TabBarIconProps = {
  color: string;
  focused: boolean;
  size: number;
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  // Helper to render tab icons
  const renderIcon = (name: string) => ({ color, focused, size }: TabBarIconProps) => {
    // Optionally adjust color or size when focused
    const iconColor = focused ? color : `${color}99`; // adds transparency when not focused
    return <IconSymbol name={name} size={size} color={iconColor} />;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.background },
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: `${theme.tint}99`, // dim inactive icons
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: renderIcon("house.fill"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: renderIcon("person.fill"),
        }}
      />
    </Tabs>
  );
}
