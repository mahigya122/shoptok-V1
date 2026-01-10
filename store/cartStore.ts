import { create } from "zustand";
import { Product } from "../types/product";
import { addToCart as apiAddToCart, fetchCart, removeCartItem } from "../services/api";

export type CartItem = {
  id: string;
  product: Product;
  size?: string;
  color?: string;
  quantity: number;
  unit_price: number;
};

export type CartState = {
  items: CartItem[];
  cartId?: string;
  loading: boolean;

  // Load all cart items for a user
  loadCart: (userId: string) => Promise<void>;

  // Add a product to cart via API
  add: (userId: string, product: Product, size?: string, color?: string, quantity?: number) => Promise<void>;

  // Add a product to cart directly in store (for VideoCard)
  addToCart: (product: Product) => void;

  // Remove item from cart
  remove: (id: string) => Promise<void>;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,

  async loadCart(userId: string) {
    set({ loading: true });
    try {
      const { cart, items } = await fetchCart(userId);
      set({
        cartId: cart.id,
        items: (items ?? []).map((item: any) => ({
          id: item.id,
          product: item.products,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
      });
    } catch (err) {
      console.warn("Failed to load cart", err);
    } finally {
      set({ loading: false });
    }
  },

  async add(userId, product, size, color, quantity = 1) {
    await apiAddToCart(userId, product, size, color, quantity);
    await get().loadCart(userId);
  },

  addToCart(product: Product) {
    // Add item to local store immediately (can later sync with backend)
    set((state) => ({
      items: [
        ...state.items,
        {
          id: `${product.id}-${Date.now()}`, // temp unique id
          product,
          quantity: 1,
          unit_price: product.price,
        },
      ],
    }));
  },

  async remove(id) {
    try {
      await removeCartItem(id);
      set({ items: get().items.filter((i) => i.id !== id) });
    } catch (err) {
      console.warn("Failed to remove cart item", err);
    }
  },
}));
