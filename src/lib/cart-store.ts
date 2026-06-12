import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
}

interface CartStore {
  items: CartItem[];
  add: (product: any, size: string, quantity?: number) => void;
  remove: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  total: number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,

      add: (product, size, quantity = 1) => {
        const items = get().items;
        const existingId = `${product.id}-${size}`;
        const existing = items.find((i) => i.id === existingId);

        if (existing) {
          set({
            items: items.map((i) =>
              i.id === existingId
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                id: existingId,
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                size,
                quantity,
                image: product.images?.[0] || "",
              },
            ],
          });
        }
      },

      remove: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().remove(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        });
      },

      clear: () => set({ items: [] }),
    }),
    { name: "luxe-cart" }
  )
);
