import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, Size } from "@/lib/products";

export interface CartItem {
  id: string; // composite of productId + size
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: Size;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  add: (product: Product, size: Size, qty?: number) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      add: (product, size, qty = 1) =>
        set((s) => {
          const id = `${product.id}-${size}`;
          const existing = s.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity + qty } : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [
              ...s.items,
              {
                id, productId: product.id, slug: product.slug, name: product.name,
                image: product.images[0], price: product.price, size, quantity: qty,
              },
            ],
            isOpen: true,
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    { name: "luxe-cart" },
  ),
);

export const selectCartCount = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.quantity, 0);
export const selectCartSubtotal = (s: CartState) =>
  s.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
