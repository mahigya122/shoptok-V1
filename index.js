// ---- GESTURE HANDLER MUST BE FIRST ----
import "react-native-gesture-handler";

// ---- REQUIRED POLYFILLS (FROM App.js) ----
import { Platform } from "react-native";

try {
  if (Platform.OS !== "web") {
    require("react-native-get-random-values");
  }
} catch {}

try {
  if (typeof URL === "undefined") {
    require("react-native-url-polyfill/auto");
  }
} catch {}

try {
  if (Platform.OS !== "web") {
    require("expo-crypto");
  }
} catch {}

import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function Root() {
  const ctx = require.context("./app", true, /\.([jt]sx?)$/);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ExpoRoot context={ctx} />
    </GestureHandlerRootView>
  );
}

registerRootComponent(Root);
