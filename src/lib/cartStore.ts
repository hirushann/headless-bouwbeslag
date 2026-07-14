import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  sync_id?: string;
  sku?: string;
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
  
  // Consolidation Feature
  isConsolidated: boolean;
  setConsolidated: (value: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
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
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },
      updateQty: (id, qty) => {
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
      syncWithServer: async () => {
        // Feature deprecated: The cart is now purely client-side.
        return Promise.resolve();
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
      
      // Consolidation Feature
      isConsolidated: false,
      setConsolidated: (value) => set({ isConsolidated: value }),
    }),
    { name: "cart-storage" }
  )
);
