import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { Product } from "../types/product";
import { useRouter } from "expo-router";

export default function ProductCard({ product }: { product: Product | any }) {
  const router = useRouter();
  const title = product?.title ?? "Untitled";
  const price = Number(product?.price) || 0;
  const imageUri = product?.images?.[0]?.url;

  return (
    <TouchableOpacity onPress={() => router.push(`/product/${product?.id}`)}>
      <View style={styles.card}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.img} />
        ) : (
          <View style={[styles.img, { backgroundColor: "#222", alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ color: colors.textMuted }}>No image</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.price}>${price.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 16, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  img: { width: 80, height: 80, borderRadius: 12, marginRight: spacing.sm },
  title: { color: colors.text, fontWeight: "700" },
  price: { color: colors.primary, fontWeight: "700", marginTop: 4 }
});
