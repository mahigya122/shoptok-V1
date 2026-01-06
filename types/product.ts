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
