import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncAddItem, syncRemoveItem, syncUpdateItem, fetchRemoteCart } from "./cartApi";

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
  syncWithServer: () => Promise<void>;
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
      syncWithServer: async () => {
        try {
          const remote = await fetchRemoteCart();
          if (remote && remote.data) {
            const remoteItems = remote.data.items; // items from WP
            const localItems = get().items;

            // 1. If remote is empty but local is not, CLEAR local (Order success case)
            if (remoteItems.length === 0 && localItems.length > 0) {
              console.log("Smart Sync: Remote cart is empty (Order placed?), clearing local cart.");
              set({ items: [] });
              return;
            }

            // 2. Optional: If remote has items, update local to match remote (Conflict resolution)
            // For now, let's trust the server if it has data.
            if (remoteItems.length > 0) {
              // Map WP items to local format if needed, or just warn if mismatch
              // A simple check: if counts match, good enough?
              // Let's do a strict sync for now: If remote has items, use remote items.
              // But we need to map WP item shape to our CartItem interface.
              // WP Item has: id, quantity, name, prices, etc.
              // Our CartItem has: id, name, price, quantity, image...

              // Implementing full sync might be complex due to data shape. 
              // The primary goal is "Clear if empty".
              // So we stick to condition #1 for now.
              console.log("Smart Sync: Remote has items", remoteItems.length);
            }
          }
        } catch (err) {
          console.warn("Smart Sync failed:", err);
        }
      },
      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);