// services/api.ts
import { supabase as supabaseClient } from "../lib/supabaseClient";
import { Product } from "../types/product";

export const supabase = supabaseClient;

// ------------------- VIDEOS -------------------
export async function fetchFeedVideos(limit = 20) {
  const { data, error } = await supabase
    .from("videos")
    .select("*, products:product_id(*), brands:brand_id(*)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  if (!data || data.length === 0) {
    // Mock videos if database is empty
    return [
      {
        id: "mock-1",
        title: "Cozy winter jacket",
        description: "Warm, stylish jacket for winter",
        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        poster: "./assets/images/react-logo.png",
        product_id: null,
        brand_id: null,
        created_at: new Date().toISOString(),
        products: [],
        brands: [],
      },
      {
        id: "mock-2",
        title: "Streetwear sneakers",
        description: "Comfortable sneakers with great grip",
        video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        poster: "./assets/images/partial-react-logo.png",
        product_id: null,
        brand_id: null,
        created_at: new Date().toISOString(),
        products: [],
        brands: [],
      },
    ];
  }

  return data;
}

// ------------------- INTERACTIONS -------------------
export async function likeVideo(videoId: string, userId: string) {
  const { error } = await supabase
    .from("video_likes")
    .upsert([{ video_id: videoId, user_id: userId }]);
  if (error && error.code !== "23505") throw error;
}

export async function viewVideo(videoId: string, userId: string) {
  // ✅ Fixed variable name
  await supabase.from("video_views").insert([{ video_id: videoId, user_id: userId }]);
  await supabase
    .from("videos")
    .update({ views_count: supabase.rpc("increment", { x: 1 }) })
    .eq("id", videoId);
}

export async function commentVideo(videoId: string, userId: string, content: string) {
  const { error } = await supabase
    .from("video_comments")
    .insert([{ video_id: videoId, user_id: userId, content }]);
  if (error) throw error;
}

// ------------------- BRANDS -------------------
export async function followBrand(brandId: string, userId: string) {
  const { error } = await supabase
    .from("brand_follows")
    .insert([{ brand_id: brandId, user_id: userId }]);
  if (error && error.code !== "23505") throw error;
}

export async function unfollowBrand(brandId: string, userId: string) {
  await supabase
    .from("brand_follows")
    .delete()
    .eq("brand_id", brandId)
    .eq("user_id", userId);
}

// ------------------- FEEDS -------------------
export async function fetchFollowingFeed(userId: string) {
  const { data: follows } = await supabase
    .from("brand_follows")
    .select("brand_id")
    .eq("user_id", userId);

  const brandIds = (follows ?? []).map(f => f.brand_id);
  if (!brandIds.length) return [];

  const { data } = await supabase
    .from("videos")
    .select("*, products:product_id(*), brands:brand_id(*)")
    .in("brand_id", brandIds)
    .order("created_at", { ascending: false });

  return data ?? [];
}

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

// ------------------- PRODUCTS -------------------
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

export async function fetchProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Product;
}

// ------------------- CART -------------------
export async function createOrGetCart(userId: string) {
  const { data } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

  if (data && data.length) return data[0];

  const { data: created, error } = await supabase
    .from("carts")
    .insert([{ user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function addToCart(userId: string, product: Product, size?: string, color?: string, quantity = 1) {
  const cart = await createOrGetCart(userId);

  const { error } = await supabase
    .from("cart_items")
    .insert([{
      cart_id: cart.id,
      product_id: product.id,
      size,
      color,
      quantity,
      unit_price: product.price,
    }]);

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

// ------------------- ORDERS -------------------
export async function createOrder(userId: string, amount: number, currency = "USD", paymentIntentId: string) {
  const { data, error } = await supabase
    .from("orders")
    .insert([{
      user_id: userId,
      amount_total: amount,
      currency,
      stripe_payment_intent_id: paymentIntentId,
      status: "created",
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ------------------- STORAGE -------------------
export async function uploadToStorage(bucket: string, path: string, file: any, contentType?: string) {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

// ------------------- VIDEO CREATION -------------------
export async function createVideoRow(video: any) {
  const { data, error } = await supabase
    .from("videos")
    .insert([video])
    .select()
    .single();

  if (error) throw error;
  return data;
}
