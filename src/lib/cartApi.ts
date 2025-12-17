
import axios from 'axios';

// The Store API base URL (public, session-based)
const STORE_API_URL = `${(process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "").replace(/\/$/, "")}/wp-json/wc/store/v1`;

// --- PROXY HELPERS ---

// Add item via Proxy
export const addItemToRemoteCart = async (productId: number, quantity: number, nonce?: string) => {
    try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (nonce) headers['X-WC-Store-API-Nonce'] = nonce;

        // Call our local proxy
        const res = await axios.post('/api/cart/sync',
            {
                action: 'add',
                productId,
                quantity
            },
            {
                headers
            }
        );

        return { data: res.data, nonce: res.headers['x-wc-store-api-nonce'] };
    } catch (error: any) {
        console.warn(`Sync: Error adding item ${productId}:`, error.message);
        return null;
    }
};

// Remove item via Proxy
export const removeRemoteCartItemProxy = async (productId: number, nonce?: string) => {
    try {
        const headers: any = { 'Content-Type': 'application/json' };
        if (nonce) headers['X-WC-Store-API-Nonce'] = nonce;

        const res = await axios.post('/api/cart/sync',
            {
                action: 'remove',
                productId
            },
            {
                headers
            }
        );
        return res.data;
    } catch (error: any) {
        console.warn(`Sync: Error removing product ${productId}:`, error.message);
        return null;
    }
}

// --- PUBLIC COMPOSITES ---

// Helper to use Proxy GET
export const fetchRemoteCart = async () => {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await axios.get('/api/cart/sync', { headers });
        return { data: res.data, nonce: res.headers['x-wc-store-api-nonce'] };
    } catch (error: any) {
        console.warn("Sync: Could not fetch remote cart:", error.message);
        return null;
    }
};

export const syncAddItem = async (productId: number, quantity: number) => {
    // 1. Get current cart/nonce
    const cartRes = await fetchRemoteCart();
    let nonce = cartRes?.nonce;

    console.log(`Syncing add: Adding product ${productId} with Nonce: ${nonce ? 'Yes' : 'No'}`);
    await addItemToRemoteCart(productId, quantity, nonce);
};

export const syncRemoveItem = async (productId: number) => {
    // 1. For remove, we ideally need the Key OR strict ID via Proxy. 
    // Our proxy handles "Find by ID" for 'remove' action if needed? 
    // Actually, the proxy code I wrote handles 'find by ID' logic inside the POST handler if 'key' is missing.
    // But we should pass the nonce if we have it.
    const cartRes = await fetchRemoteCart();
    await removeRemoteCartItemProxy(productId, cartRes?.nonce);
};

// Deprecated
export const removeRemoteCartItem = async () => { return null; };
