import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { supabase as supabaseClient } from "../../services/api";
import { getCurrentUserId, signOut } from "../../services/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

// ✅ fix: explicitly type supabase
const supabase = supabaseClient as SupabaseClient;

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    (async () => {
      const uid = await getCurrentUserId();
      if (!uid) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", uid)
        .single();

      if (!error && data) {
        setProfile(data);
        setUsername(data.username ?? "");
        setFullName(data.full_name ?? "");
      } else {
        setProfile(null);
      }
    })();
  }, []);

  const save = async () => {
    const uid = await getCurrentUserId();
    if (!uid) return;

    await supabase.from("user_profiles").upsert({
      id: uid,
      username,
      full_name: fullName,
    });
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Image
        source={{ uri: profile?.avatar_url || "https://picsum.photos/200" }}
        style={{ width: 80, height: 80, borderRadius: 40 }}
      />

      <Text style={styles.label}>Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholder="username"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.label}>Full name</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor={colors.textMuted}
      />

      <TouchableOpacity style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>
          {profile ? "Save" : "Create Profile"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={signOut}
      >
        <Text style={{ color: colors.text }}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  btnText: {
    color: "#111",
    fontWeight: "700",
    textAlign: "center",
  },
});
