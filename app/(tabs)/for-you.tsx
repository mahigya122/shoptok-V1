import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { FlashList } from "@shopify/flash-list";
import VideoCard from "../../components/VideoCard";
import { useUserStore } from "../../store/userStore";
import { fetchForYou } from "../../services/api";
import { spacing } from "../../constants/spacing";
import { colors } from "../../constants/colors";

export default function ForYouScreen() {
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
        const recs = await fetchForYou(userId);
        if (mounted) setItems(recs ?? []);
      } catch (err) {
        console.warn("Failed to fetch for-you recommendations", err);
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
          <Text style={{ color: colors.textMuted }}>No recommendations yet.</Text>
        </View>
      ) : (
        <FlashList data={items} estimatedItemSize={680} keyExtractor={(item) => item.id} renderItem={({ item }) => <VideoCard item={item} />} />
      )}
    </View>
  );
}
