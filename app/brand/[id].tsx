import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../services/api";
import { colors } from "../../constants/colors";

export default function BrandDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [brand, setBrand] = useState<any>(null);

  useEffect(() => { (async () => {
    const { data } = await supabase.from("brands").select("*").eq("id", id).single();
    setBrand(data);
  })(); }, [id]);

  if (!brand) return null;
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800" }}>{brand.name}</Text>
      <Text style={{ color: colors.textMuted }}>{brand.bio}</Text>
    </View>
  );
}
