"use server";

import api from "@/lib/woocommerce";

// ... existing imports

export async function checkStockAction(productId: number) {
    try {
        const res = await api.get(`products/${productId}`, { cache: "no-store" });
        return { success: true, data: res.data };
    } catch (error: any) {
        // console.error("Stock check error:", error?.message);
        return { success: false, error: error?.message || "Failed to fetch stock" };
    }
}

export async function fetchProductByIdAction(productId: number) {
    try {
        const res = await api.get(`products/${productId}`, { next: { revalidate: 60 } });
        return { success: true, data: res.data };
    } catch (error: any) {
        // console.error("Fetch product by ID error:", error?.message);
        return { success: false, error: error?.message || "Failed to fetch product" };
    }
}

export async function fetchProductBySkuAction(sku: string) {
    try {
        const res = await api.get("products", { sku: sku });
        const product = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
        return { success: true, data: product };
    } catch (error: any) {
        // console.error("Fetch product by SKU error:", error?.message);
        return { success: false, error: error?.message || "Failed to fetch product" };
    }
}

export async function refreshCartStockAction(productIds: number[]) {
    try {
        if (!productIds || productIds.length === 0) return { success: true, data: [] };

        const res = await api.get("products", {
            include: productIds,
            per_page: 50,
            cache: "no-store"
        }); // Assume max 50 items in cart for now

        // Map response to just what we need
        const updates = Array.isArray(res.data) ? res.data.map((p: any) => {
            const totalStockMeta = p.meta_data?.find((m: any) => m.key === "crucial_data_total_stock")?.value;
            const parsedStock = parseInt(totalStockMeta, 10);
            const totalStock = totalStockMeta !== undefined && totalStockMeta !== null && totalStockMeta !== "" && !isNaN(parsedStock)
                ? parsedStock
                : null;

            return {
                id: p.id,
                stockStatus: p.stock_status,
                stockQuantity: totalStock !== null ? totalStock : p.stock_quantity,
                leadTimeInStock: p.meta_data?.find((m: any) => m.key === "crucial_data_delivery_if_stock")?.value,
                leadTimeNoStock: p.meta_data?.find((m: any) => m.key === "crucial_data_delivery_if_no_stock")?.value,
            };
        }) : [];

        return { success: true, data: updates };
    } catch (error: any) {
        // console.error("Refresh cart stock error:", error?.message);
        return { success: false, error: error?.message || "Failed to refresh stock" };
    }
}
