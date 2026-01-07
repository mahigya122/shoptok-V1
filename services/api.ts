import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Product } from "../types/product";

const extras = (Constants.expoConfig && (Constants.expoConfig.extra || {})) || (Constants.manifest && Constants.manifest.extra) || {};
const supabaseUrl = extras.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnon = extras.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let _realClient: any = null;
function initClient() {
  if (_realClient) return _realClient;
  if (!supabaseUrl || !supabaseAnon) {
    console.warn("Supabase env vars missing: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
    _realClient = {
      auth: {
        getUser: async () => ({ data: { user: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: async () => ({ data: [], error: null }),
        insert: async () => ({ data: [], error: null }),
        update: async () => ({ data: [], error: null }),
        delete: async () => ({ data: [], error: null }),
        in: () => ({ order: () => ({ select: async () => ({ data: [], error: null }) }) }),
        order: () => ({ limit: () => ({ select: async () => ({ data: [], error: null }) }) }),
      }),
      rpc: () => 1,
    };
  } else {
    _realClient = createClient(supabaseUrl, supabaseAnon);
  }
  return _realClient;
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    const client = initClient();
    return (client as any)[prop];
  }
});

export async function fetchFeedVideos(limit = 20) {
  const { data, error } = await supabase
    .from("videos")
    .select("*, products:product_id(*) , brands:brand_id(*)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  // If the project doesn't have seeded data yet, return a small local mock
  if (!data || (Array.isArray(data) && data.length === 0)) {
    const mock = [
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
      }
    ];
    return mock as any;
  }
  return data;
}

export async function fetchDiscoverProducts(limit = 30): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as Product[];
}

export async function likeVideo(videoId: string, userId: string) {
  const { error } = await supabase.from("video_likes").insert({ video_id: videoId, user_id: userId });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function viewVideo(videoId: string, userId: string) {
  await supabase.from("video_views").insert({ video_id: videoId, user_id: userId });
  await supabase.from("videos").update({ views_count: supabase.rpc("increment", { x: 1 }) }).eq("id", videoId); // optional: use trigger
}

export async function commentVideo(videoId: string, userId: string, content: string) {
  const { error } = await supabase.from("video_comments").insert({ video_id: videoId, user_id: userId, content });
  if (error) throw error;
}

export async function followBrand(brandId: string, userId: string) {
  const { error } = await supabase.from("brand_follows").insert({ brand_id: brandId, user_id: userId });
  if (error && error.code !== "23505") throw error;
}

export async function unfollowBrand(brandId: string, userId: string) {
  await supabase.from("brand_follows").delete().eq("brand_id", brandId).eq("user_id", userId);
}

export async function fetchFollowingFeed(userId: string) {
  const { data: follows } = await supabase.from("brand_follows").select("brand_id").eq("user_id", userId);
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
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, limit: 20 }) });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export async function fetchProduct(id: string) {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Product;
}

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
    unit_price: product.price
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
  const { data, error } = await supabase.from("orders").insert({
    user_id: userId,
    amount_total: amount,
    currency,
    stripe_payment_intent_id: paymentIntentId,
    status: "created"
  }).select().single();
  if (error) throw error;
  return data;
}

// Upload a file (video or image) to Supabase Storage and return public URL
export async function uploadToStorage(bucket: string, path: string, file: any, contentType?: string) {
  // file can be a Blob, File, or base64 data URL depending on environment
  try {
    // If running in React Native with expo-file-system, file.uri is expected
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { contentType, upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  } catch (e) {
    console.warn('uploadToStorage failed', e);
    throw e;
  }
}

// Create video row in `videos` table after upload
export async function createVideoRow(video: any) {
  const { data, error } = await supabase.from('videos').insert(video).select().single();
  if (error) throw error;
  return data;
}
