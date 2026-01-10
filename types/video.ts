// types/video.ts
import { Product } from "./product";

export interface Brand {
  id: string;
  avatar_url?: string | null;
  name: string;
}

export interface VideoItem {
  id: string;
  video_url?: string | null;
  poster_url?: string | null;
  caption?: string | null;
  likes_count?: number;
  comments_count?: number;
  brands?: Brand | null;
  products?: Product | null;
  created_at?: string;
  updated_at?: string;
}

export interface VideoCardProps {
  item: VideoItem;
  onAddToCart?: (product: Product) => void;
  onFollow?: (brandId?: string) => void;
  isActive?: boolean;
}
