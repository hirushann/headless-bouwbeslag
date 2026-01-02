"use server";

import api from "@/lib/woocommerce";

export async function checkStockAction(productId: number) {
    try {
        const res = await api.get(`products/${productId}`);
        return { success: true, data: res.data };
    } catch (error: any) {
        console.error("Stock check error:", error?.message);
        return { success: false, error: error?.message || "Failed to fetch stock" };
    }
}
