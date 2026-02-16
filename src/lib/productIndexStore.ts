
import { create } from 'zustand';
import { fetchProductIndexAction } from '@/app/actions';

export interface ProductIndexItem {
    id: number;
    name: string;
    sku: string;
    identifiers: string[]; // Includes SKUs, EANs, etc. normalized to lowercase
}

interface ProductIndexStore {
    index: ProductIndexItem[];
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean;

    // Actions
    initializeIndex: () => Promise<void>;
    findProduct: (query: string) => ProductIndexItem | null;
}

export const useProductIndexStore = create<ProductIndexStore>((set, get) => ({
    index: [],
    isLoading: false,
    error: null,
    isInitialized: false,

    initializeIndex: async () => {
        const { isInitialized, isLoading } = get();
        if (isInitialized || isLoading) return;

        set({ isLoading: true, error: null });

        try {
            const res = await fetchProductIndexAction();
            if (res.success && res.data) {
                set({ index: res.data, isInitialized: true, isLoading: false });
            } else {
                set({ error: res.error || "Failed to load product index", isLoading: false });
            }
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    findProduct: (query: string) => {
        const { index } = get();
        if (!query) return null;

        const normalizedQuery = query.trim().toLowerCase();

        // 1. Try finding by ID
        const idMatch = index.find(p => String(p.id) === normalizedQuery);
        if (idMatch) return idMatch;

        // 2. Try finding by identifiers (SKU, EAN, etc)
        const identifierMatch = index.find(p => p.identifiers.includes(normalizedQuery));

        return identifierMatch || null;
    }
}));
