import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { FlashList } from "@shopify/flash-list";
import ProductCard from "../../components/ProductCard";
import { fetchDiscoverProducts } from "../../services/api";
import { Product } from "../../types/product";
import { spacing } from "../../constants/spacing";
import { colors } from "../../constants/colors";

export default function DiscoverScreen() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchDiscoverProducts();
        if (mounted && Array.isArray(data)) setProducts(data as Product[]);
      } catch (err) {
        console.warn("Failed to load discover products", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      {products.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>No products found.</Text>
      ) : (
        <FlashList
          data={products}
          estimatedItemSize={120}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}
    </View>
  );
}
