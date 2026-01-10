import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { FlashList } from "@shopify/flash-list";
import VideoCard from "../../components/VideoCard";
import { fetchFollowingFeed } from "../../services/api";
import { useUserStore } from "../../store/userStore";
import { spacing } from "../../constants/spacing";
import { colors } from "../../constants/colors";

export default function FollowingScreen() {
  const [items, setItems] = useState<any[]>([]);
  const userId = useUserStore((s) => s.userId);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!userId) {
          if (mounted) setItems([]);
          return;
        }

        const data = await fetchFollowingFeed(userId);
        if (mounted) setItems(data ?? []);
      } catch (err) {
        console.warn("Failed to load following feed", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return (
    <View style={{ flex: 1 }}>
      {items.length === 0 ? (
        <View style={{ padding: spacing.md }}>
          <Text style={{ color: colors.textMuted }}>
            No items to show.
          </Text>
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <VideoCard item={item} />
          )}
        />
      )}
    </View>
  );
}
