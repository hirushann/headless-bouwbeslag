import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addCartItem,
  calculateCartTotal,
  CartItemId,
  CartItem,
  normalizeCartItems,
  removeCartItem,
  updateCartQuantity,
} from "@/lib/cart-state";

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  addToCart: (item: CartItem) => void;
  removeItem: (id: CartItemId) => void;
  updateQty: (id: CartItemId, qty: number) => void;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
  total: () => number;
  lengthFreightCost: () => number;
  isCartOpen: boolean;
  setCartOpen: (isOpen: boolean) => void;
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  updateStockForItems: (updates: { id: CartItemId; stockStatus: string; stockQuantity: number | null; leadTimeInStock?: string; leadTimeNoStock?: string }[]) => void;
  
  // Consolidation Feature
  isConsolidated: boolean;
  setConsolidated: (value: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: addCartItem(state.items, item) })),
      addToCart: (item) => set((state) => ({ items: addCartItem(state.items, item) })),
      removeItem: (id) => set((state) => ({ items: removeCartItem(state.items, id) })),
      updateQty: (id, qty) => set((state) => ({ items: updateCartQuantity(state.items, id, qty) })),
      updateStockForItems: (updates) => {
        set((state) => ({
          items: state.items.map((i) => {
            const update = updates.find(u => String(u.id) === String(i.id));
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
      total: () => calculateCartTotal(get().items),
      lengthFreightCost: () => {
        // Fee is 29.95 if ANY item has length freight
        const hasFreight = get().items.some(i => i.hasLengthFreight);
        return hasFreight ? 29.95 : 0;
      },
      isCartOpen: false,
      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      
      // Consolidation Feature
      isConsolidated: false,
      setConsolidated: (value) => set({ isConsolidated: value }),
    }),
    {
      name: "cart-storage",
      version: 3,
      partialize: (state) => ({
        items: state.items,
        isConsolidated: state.isConsolidated,
      }),
      migrate: (persistedState: any) => ({
        ...persistedState,
        items: normalizeCartItems(persistedState?.items || []),
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    }
  )
);
