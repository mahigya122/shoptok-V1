import { create } from "zustand";
import { Product } from "../types/product";
import { addToCart, fetchCart, removeCartItem } from "../services/api";

type CartItem = {
  id: string;
  product: Product;
  size?: string;
  color?: string;
  quantity: number;
  unit_price: number;
};

type CartState = {
  items: CartItem[];
  cartId?: string;
  loading: boolean;
  loadCart: (userId: string) => Promise<void>;
  add: (userId: string, product: Product, size?: string, color?: string, quantity?: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  async loadCart(userId: string) {
    set({ loading: true });
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
      loading: false
    });
  },
  async add(userId, product, size, color, quantity = 1) {
    await addToCart(userId, product, size, color, quantity);
    await get().loadCart(userId);
  },
  async remove(id) {
    await removeCartItem(id);
    set({ items: get().items.filter(i => i.id !== id) });
  }
}));
