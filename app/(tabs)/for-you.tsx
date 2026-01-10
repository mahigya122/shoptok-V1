import { FlashList } from "@shopify/flash-list";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import VideoCard from "../../components/VideoCard";
import { fetchForYou } from "../../services/api";
import { useUserStore } from "../../store/userStore";

export default function ForYouScreen() {
  const [items, setItems] = useState<any[]>([]);
  const userId = useUserStore((s) => s.userId);
  const insetsContext = React.useContext(SafeAreaInsetsContext);
  const insets = insetsContext ?? { top: 0, bottom: 0, left: 0, right: 0 };

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
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VideoCard item={item} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
