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
