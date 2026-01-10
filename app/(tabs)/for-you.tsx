import React, { useEffect, useState } from "react";
import { View, Dimensions } from "react-native";
import { FlashList } from "@shopify/flash-list";
import VideoCard from "../../components/VideoCard";
import { useUserStore } from "../../store/userStore";
import { fetchForYou } from "../../services/api";

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
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <FlashList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <VideoCard item={item} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
