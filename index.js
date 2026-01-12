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

// ---- GESTURE HANDLER MUST BE FIRST ----
import "react-native-gesture-handler";

import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ExpoRoot context={require("./app")} />
    </GestureHandlerRootView>
  );
}

registerRootComponent(Root);
