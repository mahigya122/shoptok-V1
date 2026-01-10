import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, RefreshControl, useWindowDimensions } from "react-native";
import { FlashList, FlashListRef, ListRenderItemInfo } from "@shopify/flash-list";
import VideoCard, { VideoItem } from "./VideoCard";
import { fetchFeedVideos, followBrand } from "../services/api";
import { useLocalInteractions } from "../store/localInteractions";
import { useUserStore } from "../store/userStore";
import { useCartStore } from "../store/cartStore";
import { track } from "../services/analytics";
import { spacing } from "../constants/spacing";
import { colors } from "../constants/colors";
import { Product } from "../types/product";

export default function VideoFeed({ type = "home" }: { type?: "home" | "following" | "forYou" }) {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const userId = useUserStore((s) => s.userId);
  const addToCart = useCartStore((s) => s.add);
  const window = useWindowDimensions();
  const listRef = useRef<FlashListRef<VideoItem>>(null);

  // Load feed
  const load = async (mounted: { current: boolean }) => {
    if (type === "home") {
      try {
        const data = await fetchFeedVideos(20); // Supabase backend
        if (mounted.current) setItems(data ?? []);
      } catch (err) {
        console.warn("Failed to load feed videos", err);
        if (mounted.current) setItems([]);
      }
    }
  };

  useEffect(() => {
    const mounted = { current: true };
    load(mounted);
    return () => { mounted.current = false; };
  }, [type]);

  // Merge Supabase uploads at top
  const uploads = useLocalInteractions((s) => s.uploads);
  useEffect(() => {
    if (uploads.length) {
      setItems((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const newOnes = uploads.filter((u) => !ids.has(u.id));
        return [...newOnes, ...prev];
      });
    }
  }, [uploads]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchFeedVideos(20);
      setItems(data ?? []);
    } catch (e) { console.warn("refresh failed", e); }
    setRefreshing(false);
  }, [type]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  return (
    <View style={{ flex: 1 }}>
      {items.length === 0 ? (
        <View style={{ padding: spacing.md }}>
          <Text style={{ color: colors.textMuted }}>No videos yet.</Text>
        </View>
      ) : (
        <FlashList<VideoItem>
          ref={listRef}
          data={items}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={window.height}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }: ListRenderItemInfo<VideoItem>) => (
            <VideoCard
              item={item}
              isActive={index === currentIndex}
              onAddToCart={(product: Product) => { if (userId) addToCart(userId, product); }}
              onFollow={async (brandId) => { if (userId && brandId) await followBrand(brandId, userId); }}
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
