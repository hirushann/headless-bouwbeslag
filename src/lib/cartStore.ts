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
  slug?: string;
  stockStatus?: string;
  stockQuantity?: number | null;
  leadTimeInStock?: number;
  leadTimeNoStock?: number;
  isMaatwerk?: boolean;
  hasLengthFreight?: boolean;
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
  lengthFreightCost: () => number;
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
  updateStockForItems: (updates: { id: number; stockStatus: string; stockQuantity: number | null; leadTimeInStock?: string; leadTimeNoStock?: string }[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      // ... existing addItem ...
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
            i.id === id ? { ...i, quantity: qty, deliveryText: undefined, deliveryType: undefined } : i
          ),
        }));
      },
      updateStockForItems: (updates) => {
        set((state) => ({
          items: state.items.map((i) => {
            const update = updates.find(u => u.id === i.id);
            if (update) {
              return {
                ...i,
                stockStatus: update.stockStatus,
                stockQuantity: update.stockQuantity,
                leadTimeInStock: update.leadTimeInStock && !isNaN(parseInt(update.leadTimeInStock)) ? parseInt(update.leadTimeInStock) : i.leadTimeInStock,
                leadTimeNoStock: update.leadTimeNoStock && !isNaN(parseInt(update.leadTimeNoStock)) ? parseInt(update.leadTimeNoStock) : i.leadTimeNoStock,
                // Clear the baked-in text so it re-generates on render or we re-generate here?
                // Better to clear it so the component calculates it fresh.
                deliveryText: undefined,
                deliveryType: undefined
              };
            }
            return i;
          })
        }));
      },
      clearCart: () => set({ items: [] }),
      // ... existing syncWithServer ...
      syncWithServer: async () => {
        try {
          const remote = await fetchRemoteCart();
          if (remote && remote.data) {
            const remoteItems = remote.data.items; // items from WP
            const localItems = get().items;

            // 1. If remote is empty but local is not, CLEAR local (Order success case)
            if (remoteItems.length === 0 && localItems.length > 0) {
              // console.log("Smart Sync: Remote cart is empty (Order placed?), clearing local cart.");
              set({ items: [] });
              return;
            }

            // 2. Optional: If remote has items... (same as before)
            if (remoteItems.length > 0) {
              // ...
              // console.log("Smart Sync: Remote has items", remoteItems.length);
            }
          }
        } catch (err) {
          console.warn("Smart Sync failed:", err);
        }
      },
      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      lengthFreightCost: () => {
        // Fee is 29.95 if ANY item has length freight
        const hasFreight = get().items.some(i => i.hasLengthFreight);
        return hasFreight ? 29.95 : 0;
      },
      isCartOpen: false,
      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
    }),
    { name: "cart-storage" }
  )
);
