import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchProduct } from "../../services/api";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { useUserStore } from "../../store/userStore";
import { useCartStore } from "../../store/cartStore";
import { Product } from "../../types/product";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string | undefined>(undefined);
  const userId = useUserStore((s) => s.userId);
  const addToCart = useCartStore((s) => s.add);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const p = await fetchProduct(id);
        if (mounted) setProduct(p ?? null);
      } catch (err) {
        console.warn("Failed to load product", err);
        if (mounted) setProduct(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product) return;
    setSize(product.sizes?.[0]);
    setColor(product.colors?.[0]);
  }, [product]);

  if (!product) {
    return (
      <View style={{ flex: 1, padding: spacing.md }}>
        <Text style={{ color: colors.textMuted }}>Product not found.</Text>
      </View>
    );
  }

  const handleAdd = async () => {
    if (!userId) {
      router.push("/login");
      return;
    }
    try {
      await addToCart(userId, product, size, color, 1);
    } catch (err) {
      console.warn("Failed to add to cart", err);
    }
  };

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <Image source={{ uri: product.images?.[0]?.url }} style={{ width: "100%", height: 360, borderRadius: 16 }} />
      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.price}>${(Number(product.price) || 0).toFixed(2)}</Text>
      <Text style={styles.label}>Size</Text>
      <View style={styles.row}>
        {(product.sizes ?? []).map((s: string) => (
          <TouchableOpacity key={s} style={[styles.pill, size === s && styles.pillActive]} onPress={() => setSize(s)}>
            <Text style={styles.pillText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.label}>Color</Text>
      <View style={styles.row}>
        {(product.colors ?? []).map((c: string) => (
          <TouchableOpacity key={c} style={[styles.pill, color === c && styles.pillActive]} onPress={() => setColor(c)}>
            <Text style={styles.pillText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.btn} onPress={handleAdd}>
        <Text style={styles.btnText}>Add to cart</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontWeight: "800", fontSize: 22, marginTop: spacing.md },
  price: { color: colors.primary, fontWeight: "700", fontSize: 18, marginTop: spacing.sm },
  label: { color: colors.textMuted, marginTop: spacing.md },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.sm },
  pill: { borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  pillActive: { borderColor: colors.primary, backgroundColor: "#1D1A15" },
  pillText: { color: colors.text },
  btn: { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1, borderRadius: 12, padding: spacing.sm, marginTop: spacing.lg },
  btnText: { color: "#111", fontWeight: "700", textAlign: "center" }
});
