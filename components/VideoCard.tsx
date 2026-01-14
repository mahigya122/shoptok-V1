// VideoCard.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from "react-native";
import Animated, { useSharedValue, withSpring, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import { VideoView, useVideoPlayer } from "expo-video";
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
import type { Product } from "../types/product"; // ✅ import from global types

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
  products?: Product; // ✅ now uses global Product
}

interface VideoCardProps {
  item: VideoItem;
  onAddToCart?: (product: Product) => void;
  onFollow?: (brandId?: string) => void;
  isActive?: boolean;
}

// ---------------- COMPONENT ----------------
export default function VideoCard({ item, onAddToCart, onFollow, isActive }: VideoCardProps) {
  const [isPlaying, setPlaying] = useState(!!isActive);
  const [muted, setMuted] = useState(true);
  const [firstFrameRendered, setFirstFrameRendered] = useState(false);
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get("window").height;
  const height = windowHeight - insets.top;

  const player = useVideoPlayer(item.video_url ?? null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  const userId = useUserStore((s) => s.userId);
  const addToCart = useCartStore((s) => s.addToCart);
  const { show, Toast } = useToast();

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // ---------------- EFFECTS ----------------
  useEffect(() => setPlaying(!!isActive), [isActive]);

  useEffect(() => {
    // Reset poster state when source changes
    setFirstFrameRendered(false);
  }, [item.video_url]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    if (!item.video_url) return;
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, item.video_url, player]);

  useEffect(() => {
    if (item.id) track("view", userId, { video_id: item.id });
  }, [userId, item.id]);

  // ---------------- HANDLERS ----------------
  const handleLike = async () => {
    if (!userId) return show("Sign in to like");

    try {
      await supabase.from("video_likes").upsert([{ video_id: item.id, user_id: userId }]);
      runOnJS(show)("Liked");
      runOnJS(track)("like", userId, { video_id: item.id });

      heartOpacity.value = 1;
      heartScale.value = 0.5;
      heartScale.value = withSpring(1.2);
      heartOpacity.value = withTiming(0, { duration: 700 });

      useLocalInteractions.getState().addReaction(item.id, "❤");
    } catch (error) {
      console.warn("Error liking video:", error);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!userId) return show("Sign in to add to cart");

    // If a parent handler is provided (e.g., feed/store sync), delegate to it to
    // avoid double-inserting cart items.
    if (onAddToCart) {
      try {
        onAddToCart(product);
        show("Added to cart!");
      } catch (error) {
        console.warn("Error adding to cart:", error);
        show("Failed to add to cart");
      }
      return;
    }

    try {
      const { data: cart, error: cartErr } = await supabase
        .from("carts")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (cartErr) throw cartErr;

      let cartId = cart?.id;
      if (!cartId) {
        const { data: newCart, error: newCartErr } = await supabase
          .from("carts")
          .insert([{ user_id: userId }])
          .select()
          .single();
        if (newCartErr) throw newCartErr;
        cartId = newCart?.id;
        if (!cartId) throw new Error("Failed to create cart");
      }

      await supabase.from("cart_items").insert([{
        cart_id: cartId,
        product_id: product.id,
        quantity: 1,
        unit_price: product.price,
      }]);

      addToCart(product);
      show("Added to cart!");
    } catch (error) {
      console.warn("Error adding to cart:", error);
      show("Failed to add to cart");
    }
  };

  // ---------------- GESTURES ----------------
  const doubleTap = Gesture.Tap().numberOfTaps(2).onStart(handleLike);
  const singleTap = Gesture.Tap().onStart(() => setPlaying((p) => !p));
  const longPress = Gesture.LongPress()
    .onBegin(() => { scale.value = withSpring(0.95); })
    .onEnd(() => { scale.value = withSpring(1); });

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
          <View style={styles.video}>
            <VideoView
              player={player}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              nativeControls={false}
              surfaceType="textureView"
              onFirstFrameRender={() => setFirstFrameRendered(true)}
            />

            {!!item.poster_url && !firstFrameRendered && (
              <Image
                source={{ uri: item.poster_url }}
                style={[StyleSheet.absoluteFillObject, { resizeMode: "cover" }]}
              />
            )}
          </View>
        </GestureDetector>
      ) : <View style={[styles.video, { backgroundColor: "#000" }]} />}

      <View style={[styles.overlay, { paddingBottom: insets.bottom + spacing.md }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <Avatar url={item.brands?.avatar_url} followed={false} />
          <View style={{ marginLeft: spacing.sm, flex: 1 }}>
            <Text style={styles.brand}>{item.brands?.name}</Text>
            <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
          </View>
          <Pressable onPress={() => onFollow && onFollow(item.brands?.id)} style={styles.followBtn}>
            <Text style={styles.followText}>Follow</Text>
          </Pressable>
        </View>

        {/* ACTIONS */}
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

        {/* PRODUCT BAR */}
        {item.products && (
          <View style={styles.productBar}>
            {item.products.images?.[0]?.url ? (
              <Image source={{ uri: item.products.images[0].url }} style={styles.productImg} />
            ) : <View style={[styles.productImg, { backgroundColor: "#222" }]} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.productTitle}>{item.products.title}</Text>
              <Text style={styles.productPrice}>{item.products.currency} {Number(item.products.price).toFixed(2)}</Text>
            </View>
            <Pressable style={styles.addBtn} onPress={() => handleAddToCart(item.products!)}>
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

// ---------------- STYLES ----------------
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
