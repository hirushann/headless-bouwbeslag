
import axios from 'axios';

// The Store API base URL (public, session-based)
const STORE_API_URL = `${(process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "").replace(/\/$/, "")}/wp-json/wc/store/v1`;

// Helper to fetch the current remote cart to find the 'key' (hash) for a product ID
export const fetchRemoteCart = async () => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await axios.get(`${STORE_API_URL}/cart`, {
            withCredentials: true, // Important for cookie/session sharing
            headers
        });

        // Capture Nonce
        const nonce = res.headers['x-wc-store-api-nonce'];

        return { data: res.data, nonce };
    } catch (error: any) {
        // Use warn to avoid blocking Next.js overlay for network errors (common in dev with CORS)
        console.warn("Sync: Could not fetch remote cart:", error.message);
        return null;
    }
};

// Remove item by key (hash)
export const removeRemoteCartItem = async (key: string, nonce?: string) => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: any = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (nonce) {
            headers['X-WC-Store-API-Nonce'] = nonce;
        }

        const res = await axios.delete(`${STORE_API_URL}/cart/items/${key}`, {
            withCredentials: true,
            headers
        });
        return res.data;
    } catch (error: any) {
        console.warn(`Sync: Error removing item ${key}:`, error.message);
        return null;
    }
};

// Composite function: Find item by Product ID and remove it
export const syncRemoveItem = async (productId: number) => {
    const result = await fetchRemoteCart();

    if (!result || !result.data || !result.data.items) return;

    const { data: cartData, nonce } = result;

    // Find the item with matching id
    const item = cartData.items.find((i: any) => i.id === productId);

    if (item && item.key) {
        console.log(`Syncing removal: Found remote item ${item.key}. Removing with Nonce: ${nonce ? 'Yes' : 'No'}`);
        await removeRemoteCartItem(item.key, nonce);
    } else {
        console.log(`Syncing removal: No remote item found for product ${productId}.`);
    }
};
