// supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Product } from "../types/product";

// Load Supabase keys from Expo constants or environment variables
const extras =
  (Constants.expoConfig?.extra || {}) ||
  (Constants.manifest?.extra || {}) ||
  {};

const SUPABASE_URL = extras.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = extras.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase keys are missing. Check your .env or app.json.");
}

// Initialize client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ------------------------ VIDEO FEED ------------------------ */

// Fetch videos feed (home feed)
export async function fetchFeedVideos(limit = 20) {
  const { data, error } = await supabase
    .from("videos")
    .select("*, products:product_id(*), brands:brand_id(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  if (!data || data.length === 0) {
    // fallback mock data
    return [
      {
        id: "mock-1",
        title: "Cozy winter jacket",
        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        poster: "./assets/images/react-logo.png",
        products: [],
        brands: [],
      },
      {
        id: "mock-2",
        title: "Streetwear sneakers",
        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        poster: "./assets/images/partial-react-logo.png",
        products: [],
        brands: [],
      },
    ] as any;
  }

  return data;
}

// Like a video
export async function likeVideo(videoId: string, userId: string) {
  const { error } = await supabase.from("video_likes").insert({ video_id: videoId, user_id: userId });
  if (error && error.code !== "23505") throw error; // ignore duplicates
}

// View a video
export async function viewVideo(videoId: string, userId: string) {
  await supabase.from("video_views").insert({ video_id: videoId, user_id: userId });
  await supabase
    .from("videos")
    .update({ views_count: supabase.rpc("increment", { x: 1 }) })
    .eq("id", videoId);
}

// Comment on video
export async function commentVideo(videoId: string, userId: string, content: string) {
  const { error } = await supabase
    .from("video_comments")
    .insert({ video_id: videoId, user_id: userId, content });
  if (error) throw error;
}

/* ------------------------ BRANDS & FOLLOWING ------------------------ */

// Follow brand
export async function followBrand(brandId: string, userId: string) {
  const { error } = await supabase.from("brand_follows").insert({ brand_id: brandId, user_id: userId });
  if (error && error.code !== "23505") throw error;
}

// Unfollow brand
export async function unfollowBrand(brandId: string, userId: string) {
  await supabase.from("brand_follows").delete().eq("brand_id", brandId).eq("user_id", userId);
}

// Fetch following feed
export async function fetchFollowingFeed(userId: string) {
  const { data: follows } = await supabase.from("brand_follows").select("brand_id").eq("user_id", userId);
  const brandIds = (follows ?? []).map((f: any) => f.brand_id);
  if (!brandIds.length) return [];

  const { data } = await supabase
    .from("videos")
    .select("*, products:product_id(*), brands:brand_id(*)")
    .in("brand_id", brandIds)
    .order("created_at", { ascending: false });

  return data ?? [];
}

// Fetch "For You" feed (via your recommendation function)
export async function fetchForYou(userId: string) {
  const url = process.env.RECOMMENDATION_FUNCTION_URL!;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, limit: 20 }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

/* ------------------------ PRODUCTS ------------------------ */

export async function fetchDiscoverProducts(limit = 30): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Product[];
}

export async function fetchProduct(id: string): Promise<Product> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Product;
}

/* ------------------------ CART & ORDERS ------------------------ */

export async function createOrGetCart(userId: string) {
  const { data } = await supabase.from("carts").select("*").eq("user_id", userId).eq("status", "active").limit(1);
  if (data && data.length) return data[0];

  const { data: created, error } = await supabase.from("carts").insert({ user_id: userId }).select().single();
  if (error) throw error;
  return created;
}

export async function addToCart(userId: string, product: Product, size?: string, color?: string, quantity = 1) {
  const cart = await createOrGetCart(userId);
  const { error } = await supabase.from("cart_items").insert({
    cart_id: cart.id,
    product_id: product.id,
    size,
    color,
    quantity,
    unit_price: product.price,
  });
  if (error) throw error;
}

export async function fetchCart(userId: string) {
  const cart = await createOrGetCart(userId);
  const { data } = await supabase
    .from("cart_items")
    .select("*, products:product_id(*)")
    .eq("cart_id", cart.id);
  return { cart, items: data ?? [] };
}

export async function removeCartItem(id: string) {
  await supabase.from("cart_items").delete().eq("id", id);
}

export async function createOrder(userId: string, amount: number, currency = "USD", paymentIntentId: string) {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      amount_total: amount,
      currency,
      stripe_payment_intent_id: paymentIntentId,
      status: "created",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ------------------------ STORAGE / UPLOAD ------------------------ */

export async function uploadToStorage(bucket: string, path: string, file: any, contentType?: string) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { contentType, upsert: false });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

export async function createVideoRow(video: any) {
  const { data, error } = await supabase.from("videos").insert(video).select().single();
  if (error) throw error;
  return data;
}
