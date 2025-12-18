import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncAddItem, syncRemoveItem, syncUpdateItem } from "./cartApi";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  brand?: string;
  model?: string;
  deliveryText?: string;
  deliveryType?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  addToCart: (item: CartItem) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        // Sync with backend in background
        syncAddItem(item.id, item.quantity).catch(err => console.error("Error syncing cart add:", err));

        set((state) => {
          const exists = state.items.find((i) => i.id === item.id);
          if (exists) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, ...item, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      addToCart: (item) => {
        // Sync with backend in background
        syncAddItem(item.id, item.quantity).catch(err => console.error("Error syncing cart add:", err));

        set((state) => {
          const exists = state.items.find((i) => i.id === item.id);
          if (exists) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, ...item, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      removeItem: (id) => {
        // Sync with backend in background
        syncRemoveItem(id).catch(err => console.error("Error syncing cart removal:", err));

        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },
      updateQty: (id, qty) => {
        // Sync with backend
        syncUpdateItem(id, qty).catch(err => console.error("Error syncing qty:", err));

        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: qty } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);