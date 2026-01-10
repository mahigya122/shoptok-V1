// types/product.ts

export interface Product {
  id: string;
  brand_id: string | null;
  title: string;
  description?: string;
  price: number;
  currency: string;
  sizes: string[];        // array of strings
  colors: string[];       // array of strings
  images: { url: string }[]; // array of image objects
  status: "active" | "inactive" | string; // optional union for stricter types
  created_at?: string;    // timestamps from Supabase
  updated_at?: string;
}
