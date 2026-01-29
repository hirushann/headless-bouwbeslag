"use server";

import api from "@/lib/woocommerce";

// ... existing imports

export async function checkStockAction(productId: number) {
    try {
        const res = await api.get(`products/${productId}`);
        return { success: true, data: res.data };
    } catch (error: any) {
        console.error("Stock check error:", error?.message);
        return { success: false, error: error?.message || "Failed to fetch stock" };
    }
}

export async function fetchProductByIdAction(productId: number) {
    try {
        const res = await api.get(`products/${productId}`);
        return { success: true, data: res.data };
    } catch (error: any) {
        console.error("Fetch product by ID error:", error?.message);
        return { success: false, error: error?.message || "Failed to fetch product" };
    }
}

export async function fetchProductBySkuAction(sku: string) {
    try {
        const res = await api.get("products", { sku: sku });
        const product = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
        return { success: true, data: product };
    } catch (error: any) {
        console.error("Fetch product by SKU error:", error?.message);
        return { success: false, error: error?.message || "Failed to fetch product" };
    }
}

export async function refreshCartStockAction(productIds: number[]) {
    try {
        if (!productIds || productIds.length === 0) return { success: true, data: [] };

        const res = await api.get("products", { include: productIds, per_page: 50 }); // Assume max 50 items in cart for now
        
        // Map response to just what we need
        const updates = Array.isArray(res.data) ? res.data.map((p: any) => ({
             id: p.id,
             stockStatus: p.stock_status,
             stockQuantity: p.stock_quantity,
        })) : [];

        return { success: true, data: updates };
    } catch (error: any) {
        console.error("Refresh cart stock error:", error?.message);
        return { success: false, error: error?.message || "Failed to refresh stock" };
    }
}
