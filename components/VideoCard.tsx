import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from "react-native";
import Animated, { useSharedValue, withSpring, useAnimatedStyle, withTiming, runOnJS } from "react-native-reanimated";
import { Video, ResizeMode } from "expo-av";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import Avatar from "./Avatar";
import ShareSheet from "./ShareSheet";
import CommentsModal from './CommentsModal';
import { useToast } from "./Toast";
import { likeVideo, commentVideo } from "../services/api";
import { useUserStore } from "../store/userStore";
import { useCartStore } from "../store/cartStore";
import { useLocalInteractions } from "../store/localInteractions";
import { track } from "../services/analytics";

export default function VideoCard({ item, onAddToCart, onFollow, isActive }: any) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setPlaying] = useState(!!isActive);
  const headerHeight = useHeaderHeight();
  const height = Dimensions.get("window").height - headerHeight;
  const [muted, setMuted] = useState(true);
  const userId = useUserStore((s) => s.userId);
  const { show, Toast } = useToast();
  const insets = useSafeAreaInsets();
  const addToCart = useCartStore((s) => s.add);
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  useEffect(() => {
    setPlaying(!!isActive);
  }, [isActive]);

  useEffect(() => {
    if (item?.id) track("view", userId, { video_id: item.id });
  }, [userId, item?.id]);

  const handleLike = () => {
    if (!userId) {
      show("Sign in to like");
      return;
    }
    likeVideo(item.id, userId)
      .then(() => {
        runOnJS(show)("Liked");
        runOnJS(track)("like", userId, { video_id: item.id });
        heartOpacity.value = 1;
        heartScale.value = 0.5;
        heartScale.value = withSpring(1.2);
        heartOpacity.value = withTiming(0, { duration: 700 });
      })
      .catch((e) => console.warn(e));
    try {
      useLocalInteractions.getState().addReaction(item.id, "❤");
    } catch (e) {}
  };

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      handleLike();
    });

  const singleTap = Gesture.Tap().onStart(() => {
    setPlaying((p) => !p);
  });

  const [commentsOpen, setCommentsOpen] = React.useState(false);

  const scale = useSharedValue(1);
  const longPress = Gesture.LongPress()
    .onBegin(() => {
      scale.value = withSpring(0.95);
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedHeartStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: heartScale.value }],
      opacity: heartOpacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, { height }, animatedStyle]}>
      {item?.video_url ? (
        <GestureDetector gesture={Gesture.Exclusive(longPress, doubleTap, singleTap)}>
          <Video
            ref={videoRef}
            source={{ uri: item.video_url }}
            posterSource={item?.poster_url ? { uri: item.poster_url } : undefined}
            usePoster={!!item?.poster_url}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={isPlaying}
            isMuted={muted}
            progressUpdateIntervalMillis={200}
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
            <Text style={styles.caption} numberOfLines={2}>{item.caption}</Text>
          </View>
          <Pressable onPress={() => onFollow?.(item.brands?.id)} style={styles.followBtn} android_ripple={{ color: '#00000010' }}>
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
          <Pressable onPress={async () => {
            if (!userId) { show("Sign in to like"); return; }
            try {
              await likeVideo(item.id, userId);
              show("Liked");
              track("like", userId, { video_id: item.id });
                // optimistic local reaction
                useLocalInteractions.getState().addReaction(item.id, '❤');
            } catch (e) {
              console.warn("like failed", e);
            }
          }} style={styles.actionBtn}>
            <Text style={styles.action}>♥ {item.likes_count ?? 0}</Text>
          </Pressable>
          <Pressable onPress={async () => {
            if (!userId) { show("Sign in to comment"); return; }
            try {
                useLocalInteractions.getState().addComment(item.id, { id: Math.random().toString(36).slice(2), userId, text: '🔥', createdAt: new Date().toISOString() });
                await commentVideo(item.id, userId, "🔥");
              show("Commented");
              track("comment", userId, { video_id: item.id });
            } catch (e) {
              console.warn("comment failed", e);
            }
          }} style={styles.actionBtn}>
            <Text style={styles.action}>💬 {item.comments_count ?? 0}</Text>
          </Pressable>
          <Pressable onPress={() => setCommentsOpen(true)} style={styles.actionBtn}><Text style={styles.action}>Open</Text></Pressable>
          <ShareSheet url={`https://shoptok.app/video/${item.id}`} title={item.caption || "Check this out!"} />
        </View>

        {item.products && (
          <View style={styles.productBar}>
            {item.products?.images?.[0]?.url ? (
              <Image source={{ uri: item.products.images[0].url }} style={styles.productImg} />
            ) : (
              <View style={[styles.productImg, { backgroundColor: "#222" }]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.productTitle}>{item.products?.title ?? "Untitled"}</Text>
              <Text style={styles.productPrice}>${(Number(item.products?.price) || 0).toFixed(2)}</Text>
            </View>
            <Pressable
              style={styles.addBtn}
              onPress={() => {
                if (!userId) {
                  show("Sign in to add to cart");
                  return;
                }
                addToCart(userId, item.products);
                show("Added to cart");
              }}
              android_ripple={{ color: "#00000010" }}
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
  container: { height: 680, backgroundColor: "#000" },
  video: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  overlay: { position: "absolute", left: 0, right: 0, bottom: 0, padding: spacing.md },
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  brand: { color: colors.text, fontSize: 16, fontWeight: "700" },
  caption: { color: colors.textMuted },
  followBtn: { marginLeft: "auto", borderWidth: 1, borderColor: colors.primary, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 8 },
  followText: { color: colors.primary, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.md },
  action: { color: colors.text, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  productBar: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(18,19,22,0.9)", borderRadius: 16, padding: spacing.sm, borderWidth: 1, borderColor: colors.border },
  productImg: { width: 64, height: 64, borderRadius: 10, marginRight: spacing.sm },
  productTitle: { color: colors.text, fontWeight: "700" },
  productPrice: { color: colors.primary, fontWeight: "700" },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 12 },
  addText: { color: "#111", fontWeight: "700" }
  ,
  heartWrap: { position: 'absolute', top: '40%', left: '45%', justifyContent: 'center', alignItems: 'center' },
  heart: { fontSize: 72, color: 'rgba(255,50,90,0.95)', textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }
});
