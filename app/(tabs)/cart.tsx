import React, { useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useCartStore } from "../../store/cartStore";
import { useUserStore } from "../../store/userStore";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { useRouter } from "expo-router";

export default function CartScreen() {
  const items = useCartStore((s) => s.items);
  const loadCart = useCartStore((s) => s.loadCart);
  const remove = useCartStore((s) => s.remove);
  const userId = useUserStore((s) => s.userId);
  const router = useRouter();

  useEffect(() => {
    if (userId) loadCart(userId);
  }, [userId, loadCart]);

  const total = items.reduce((sum, i) => sum + (Number(i.unit_price) || 0) * (i.quantity || 0), 0);

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      {items.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Your cart is empty.</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Image source={{ uri: item.product?.images?.[0]?.url }} style={styles.img} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.product?.title ?? "Untitled"}</Text>
              <Text style={styles.meta}>Size: {item.size ?? "-"} • Color: {item.color ?? "-"}</Text>
              <Text style={styles.price}>${(Number(item.unit_price) || 0).toFixed(2)} x {item.quantity ?? 0}</Text>
            </View>
            <TouchableOpacity onPress={() => remove(item.id)}>
              <Text style={{ color: colors.danger }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        <TouchableOpacity style={styles.checkout} onPress={() => router.push("/checkout")}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, padding: spacing.sm },
  img: { width: 64, height: 64, borderRadius: 12, marginRight: spacing.sm },
  title: { color: colors.text, fontWeight: "700" },
  meta: { color: colors.textMuted, marginTop: 4 },
  price: { color: colors.primary, fontWeight: "700", marginTop: 4 },
  footer: { marginTop: "auto", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  total: { color: colors.text, fontWeight: "700", fontSize: 18 },
  checkout: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: 12 },
  checkoutText: { color: "#111", fontWeight: "700" }
});
