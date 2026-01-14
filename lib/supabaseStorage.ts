import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Supabase expects a simple string key/value storage.
// SecureStore is async and encrypted on-device.
export const supabaseStorage = {
  async getItem(key: string) {
    if (Platform.OS === "web") {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }

    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        // ignore
      }
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string) {
    if (Platform.OS === "web") {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        // ignore
      }
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};
