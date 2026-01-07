import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Image, Animated } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import Avatar from "./Avatar";
import ShareSheet from "./ShareSheet";
import CommentsModal from './CommentsModal';
import { useToast } from "./Toast";
import { likeVideo, commentVideo } from "../services/api";
import { useUserStore } from "../store/userStore";
import { useLocalInteractions } from "../store/localInteractions";
import { track } from "../services/analytics";

export default function VideoCard({ item, onAddToCart, onFollow, isActive, height = 680 }: any) {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setPlaying] = useState(!!isActive);
  const [muted, setMuted] = useState(true);
  const userId = useUserStore((s) => s.userId);
  const { show, Toast } = useToast();
  const scale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setPlaying(!!isActive);
  }, [isActive]);

  useEffect(() => {
    if (item?.id) track("view", userId, { video_id: item.id });
  }, [userId, item?.id]);

  // simple double-tap detection for like
  const lastTap = useRef<number>(0);
  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // double-tap -> like
      if (!userId) { show("Sign in to like"); return; }
      likeVideo(item.id, userId)
        .then(() => {
          show("Liked");
          track("like", userId, { video_id: item.id });
          // trigger heart animation
          heartOpacity.setValue(1);
          heartScale.setValue(0.5);
          Animated.parallel([
            Animated.spring(heartScale, { toValue: 1.2, useNativeDriver: true }),
            Animated.timing(heartOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
          ]).start();
        })
        .catch((e) => console.warn(e));
      // update local reactions immediately for responsiveness
      try {
        useLocalInteractions.getState().addReaction(item.id, '❤');
      } catch (e) {}
    } else {
      // single tap -> toggle play
      setPlaying((p) => !p);
    }
    lastTap.current = now;
  };

  const [commentsOpen, setCommentsOpen] = React.useState(false);

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.container, { height }, { transform: [{ scale }] }]}> 
      {item?.video_url ? (
        <Pressable onPress={onTap} onPressIn={onPressIn} onPressOut={onPressOut} style={{ flex: 1 }}>
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
        </Pressable>
      ) : (
        <View style={[styles.video, { backgroundColor: "#000" }]} />
      )}
      <View style={styles.overlay}>
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
            <Pressable style={styles.addBtn} onPress={() => {
              if (!userId) { show("Sign in to add to cart"); return; }
              onAddToCart?.(item.products);
            }} android_ripple={{ color: '#00000010' }}>
              <Text style={styles.addText}>Add</Text>
            </Pressable>
          </View>
        )}
      </View>
      <Toast />
      <CommentsModal visible={commentsOpen} videoId={item.id} onClose={() => setCommentsOpen(false)} />
      <Animated.View pointerEvents="none" style={[styles.heartWrap, { transform: [{ scale: heartScale }], opacity: heartOpacity }]}>
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
