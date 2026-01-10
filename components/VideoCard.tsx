// VideoCard.tsx
import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Video, ResizeMode as VideoResizeMode } from "expo-av";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import Avatar from "./Avatar";
import ShareSheet from "./ShareSheet";
import CommentsModal from "./CommentsModal";
import { useToast } from "./Toast";
import { useUserStore } from "../store/userStore";
import { useCartStore } from "../store/cartStore";
import { useLocalInteractions } from "../store/localInteractions";
import { track } from "../services/analytics";

// Supabase client
import { supabase } from "../lib/supabaseClient";

// ---------------- TYPES ----------------
export interface Product {
  id: string;
  brand_id: string | null;
  title: string;
  description?: string;
  price: number;
  currency: string;
  sizes: string[];
  colors: string[];
  images: { url: string }[];
  status: string;
}

export interface Brand {
  id?: string;
  avatar_url?: string;
  name?: string;
}

export interface VideoItem {
  id: string;
  video_url?: string;
  poster_url?: string;
  caption?: string;
  likes_count?: number;
  comments_count?: number;
  brands?: Brand;
  products?: Product;
}

interface VideoCardProps {
  item: VideoItem;
  onAddToCart?: (product: Product) => void;
  onFollow?: (brandId?: string) => void;
  isActive?: boolean;
}

// ---------------- COMPONENT ----------------
export default function VideoCard({ item, onAddToCart, onFollow, isActive }: VideoCardProps) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setPlaying] = useState(!!isActive);
  const [muted, setMuted] = useState(true);
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get("window").height;
  const height = windowHeight - insets.top;

  const userId = useUserStore((s) => s.userId);
  const addToCart = useCartStore((s) => s.addToCart);
  const { show, Toast } = useToast();

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // Effects
  useEffect(() => setPlaying(!!isActive), [isActive]);
  useEffect(() => {
    if (item.id) track("view", userId, { video_id: item.id });
  }, [userId, item.id]);

  // ---------------- Handlers ----------------
  const handleLike = async () => {
    if (!userId) return show("Sign in to like");

    try {
      // Update likes in Supabase
      await supabase
        .from("video_likes")
        .upsert({ video_id: item.id, user_id: userId })
        .throwOnError();

      runOnJS(show)("Liked");
      runOnJS(track)("like", userId, { video_id: item.id });

      heartOpacity.value = 1;
      heartScale.value = 0.5;
      heartScale.value = withSpring(1.2);
      heartOpacity.value = withTiming(0, { duration: 700 });

      // Local state interaction
      useLocalInteractions.getState().addReaction(item.id, "❤");
    } catch (error) {
      console.warn("Error liking video:", error);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!userId) return show("Sign in to add to cart");

    // Update Supabase cart
    try {
      await supabase.from("cart").upsert({
        user_id: userId,
        product_id: product.id,
        quantity: 1,
      });

      // Update local store
      addToCart(product);
      show("Added to cart!");
    } catch (error) {
      console.warn("Error adding to cart:", error);
      show("Failed to add to cart");
    }
  };

  const doubleTap = Gesture.Tap().numberOfTaps(2).onStart(handleLike);
  const singleTap = Gesture.Tap().onStart(() => setPlaying((p) => !p));
  const longPress = Gesture.LongPress()
    .onBegin(() => {
      scale.value = withSpring(0.95);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  // ---------------- RENDER ----------------
  return (
    <Animated.View style={[styles.container, { height }, animatedStyle]}>
      {item.video_url ? (
        <GestureDetector gesture={Gesture.Exclusive(longPress, doubleTap, singleTap)}>
          <Video
            ref={videoRef}
            source={{ uri: item.video_url }}
            posterSource={item.poster_url ? { uri: item.poster_url } : undefined}
            usePoster={!!item.poster_url}
            style={styles.video}
            resizeMode={VideoResizeMode.COVER}
            isLooping
            shouldPlay={isPlaying}
            isMuted={muted}
            useNativeControls={false}
          />
        </GestureDetector>
      ) : (
        <View style={[styles.video, { backgroundColor: "#000" }]} />
      )}

      <View style={[styles.overlay, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <Avatar url={item.brands?.avatar_url} followed={false} />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={styles.brand}>{item.brands?.name}</Text>
            <Text style={styles.caption} numberOfLines={2}>
              {item.caption}
            </Text>
          </View>
          <Pressable onPress={() => onFollow && onFollow(item.brands?.id)} style={styles.followBtn}>
            <Text style={styles.followText}>Follow</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => setPlaying(!isPlaying)} style={styles.actionBtn}>
            <Text style={styles.action}>{isPlaying ? "Pause" : "Play"}</Text>
          </Pressable>
          <Pressable onPress={() => setMuted(!muted)} style={styles.actionBtn}>
            <Text style={styles.action}>{muted ? "Unmute" : "Mute"}</Text>
          </Pressable>
          <Pressable onPress={handleLike} style={styles.actionBtn}>
            <Text style={styles.action}>♥ {item.likes_count ?? 0}</Text>
          </Pressable>
          <Pressable onPress={() => setCommentsOpen(true)} style={styles.actionBtn}>
            <Text style={styles.action}>💬 {item.comments_count ?? 0}</Text>
          </Pressable>
          <ShareSheet url={`https://shoptok.app/video/${item.id}`} title={item.caption || "Check this out!"} />
        </View>

        {item.products && (
          <View style={styles.productBar}>
            {item.products.images?.[0]?.url ? (
              <Image source={{ uri: item.products.images[0].url }} style={styles.productImg} />
            ) : (
              <View style={[styles.productImg, { backgroundColor: "#222" }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.productTitle}>{item.products.title}</Text>
              <Text style={styles.productPrice}>
                {item.products.currency} {Number(item.products.price).toFixed(2)}
              </Text>
            </View>
            <Pressable
              style={styles.addBtn}
              onPress={() => item.products && handleAddToCart(item.products)}
            >
              <Text style={styles.addText}>Add</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Toast />
      <CommentsModal visible={commentsOpen} videoId={item.id} onClose={() => setCommentsOpen(false)} />
      <Animated.View pointerEvents="none" style={[styles.heartWrap, animatedHeartStyle]}>
        <Text style={styles.heart}>❤</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#000" },
  video: { ...StyleSheet.absoluteFillObject },
  overlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: spacing.md },
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  brand: { color: colors.text, fontSize: 16, fontWeight: "700" },
  caption: { color: colors.textMuted },
  followBtn: {
    marginLeft: "auto",
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  followText: { color: colors.primary, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md, gap: 12 },
  action: {
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  productBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18,19,22,0.9)",
    borderRadius: 16,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImg: { width: 64, height: 64, borderRadius: 10, marginRight: spacing.sm },
  productTitle: { color: colors.text, fontWeight: "700" },
  productPrice: { color: colors.primary, fontWeight: "700" },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 12 },
  addText: { color: "#111", fontWeight: "700" },
  heartWrap: { position: "absolute", top: "40%", left: "45%", justifyContent: "center", alignItems: "center" },
  heart: {
    fontSize: 72,
    color: "rgba(255,50,90,0.95)",
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
