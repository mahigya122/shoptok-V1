import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, RefreshControl, useWindowDimensions } from "react-native";
import { FlashList } from "@shopify/flash-list";
import VideoCard from "./VideoCard";
import { fetchFeedVideos, followBrand } from "../services/api";
import { useUserStore } from "../store/userStore";
import { useCartStore } from "../store/cartStore";
import { track } from "../services/analytics";
import { spacing } from "../constants/spacing";
import { colors } from "../constants/colors";

export default function VideoFeed({ type = "home" }: { type?: "home" | "following" | "forYou" }) {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const userId = useUserStore((s) => s.userId);
  const addToCart = useCartStore((s) => s.add);
  const window = useWindowDimensions();
  const listRef = useRef<any>(null);

  async function load(mounted: { current: boolean }) {
    if (type === "home") {
      try {
        const data = await fetchFeedVideos(20);
        if (mounted.current) setItems(data ?? []);
      } catch (err) {
        console.warn("Failed to load feed videos", err);
        if (mounted.current) setItems([]);
      }
    }
  }

  useEffect(() => {
    const mounted = { current: true };
    load(mounted);
    return () => { mounted.current = false; };
  }, [type]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchFeedVideos(20);
      setItems(data ?? []);
    } catch (e) {
      console.warn("refresh failed", e);
    }
    setRefreshing(false);
  }, [type]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length) {
      const idx = viewableItems[0].index ?? 0;
      setCurrentIndex(idx);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  return (
    <View style={{ flex: 1 }}>
      {items.length === 0 ? (
        <View style={{ padding: spacing.md }}>
          <Text style={{ color: colors.textMuted }}>No videos yet.</Text>
        </View>
      ) : (
        <FlashList
          ref={listRef}
          data={items}
          estimatedItemSize={window.height}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={window.height}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <VideoCard
              item={item}
              isActive={index === currentIndex}
              height={window.height}
              onAddToCart={async (product: any) => {
                if (!userId) return;
                try {
                  await addToCart(userId, product, product.sizes?.[0], product.colors?.[0], 1);
                  track("cart_add", userId, { product_id: product.id });
                } catch (e) {
                  console.warn("add to cart failed", e);
                }
              }}
              onFollow={async (brandId: string) => {
                if (!userId) return;
                try {
                  await followBrand(brandId, userId);
                  track("follow", userId, { brand_id: brandId });
                } catch (e) {
                  console.warn("follow failed", e);
                }
              }}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}
    </View>
  );
}
