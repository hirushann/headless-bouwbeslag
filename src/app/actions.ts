"use server";

import api from "@/lib/woocommerce";


export async function checkStockAction(productId: number) {
    try {
        const res = await api.get(`products/${productId}`, { cache: "no-store" });
        return { success: true, data: res.data };
    } catch (error: any) {
        return { success: false, error: error?.message || "Failed to fetch stock" };
    }
}

export async function fetchProductByIdAction(productId: number) {
    try {
        const res = await api.get(`products/${productId}`, { next: { revalidate: 60 } });
        return { success: true, data: res.data };
    } catch (error: any) {
        return { success: false, error: error?.message || "Failed to fetch product" };
    }
}

export async function fetchProductBySkuAction(sku: string) {
    try {
        const res = await api.get("products", { sku: sku });
        const product = Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
        return { success: true, data: product };
    } catch (error: any) {
        return { success: false, error: error?.message || "Failed to fetch product" };
    }
}

export async function fetchProductBySkuOrIdAction(identifier: string | number, excludeId?: number) {
    const idStr = String(identifier).trim();
    if (!idStr) return { success: true, data: null };

    const numericExcludeId = excludeId ? Number(excludeId) : null;

    // Only log if we are actually excluding something, to reduce noise for normal lookups
    // console.log(`[LOOKUP] START: "${idStr}" (Exclude: ${numericExcludeId})`);

    try {
        // 1. Precise SKU Lookup
        const skuRes = await api.get("products", { sku: idStr, per_page: 1, cache: "no-store", status: "publish" });
        if (Array.isArray(skuRes.data) && skuRes.data.length > 0) {
            const match = skuRes.data[0];
            if (match && Number(match.id) !== numericExcludeId) {
                console.log(`[LOOKUP] ✅ Match SKU (Woo): ${match.id}`);
                return { success: true, data: match };
            }
        }



        // 3. Parallel WP Meta Query
        const targetMetaKeys = [
            "crucial_data_product_ean_code",
            "_sku",
            "crucial_data_product_factory_sku",
            "ean_code",
            "ean",
            "_global_unique_id",
            "gtin",
            "upc",
            "isbn",
            "_wpm_gtin_code",
            "global_unique_id",
            "_wpm_gtin",
            "_gtin",
            "_ean"
        ];

        try {
            // We'll trust the first valid hit
            let foundMatch: { id: number; key: string } | null = null;

            const metaResults = await Promise.all(targetMetaKeys.map(async (key) => {
                try {
                    const wpRes = await api.get("wp/v2/product", {
                        meta_key: key,
                        meta_value: idStr,
                        _fields: "id",
                        per_page: 1,
                        cache: "no-store"
                    });
                    if (Array.isArray(wpRes.data) && wpRes.data.length > 0) {
                        const hit = wpRes.data[0];
                        if (hit.id && Number(hit.id) !== numericExcludeId) {
                            return { id: Number(hit.id), key: key };
                        }
                    }
                } catch (e) { }
                return null;
            }));

            foundMatch = metaResults.find(m => m !== null) || null;

            if (foundMatch) {
                const finalRes = await api.get(`products/${foundMatch.id}`, { cache: "no-store" });
                if (finalRes.data && finalRes.data.id) {
                    console.log(`[LOOKUP] ✅ Match WP Meta (${foundMatch.key}): ${finalRes.data.id}`);
                    return { success: true, data: finalRes.data };
                }
            }
        } catch (err) { }

        // 4. Precise ID Lookup
        const numericId = Number(idStr);
        if (!isNaN(numericId) && /^\d+$/.test(idStr) && idStr.length < 9 && numericId !== numericExcludeId) {
            try {
                const idRes = await api.get(`products/${numericId}`, { cache: "no-store" });
                if (idRes.data && idRes.data.id) {
                    console.log(`[LOOKUP] ✅ Match ID: ${idRes.data.id}`);
                    return { success: true, data: idRes.data };
                }
            } catch (e) { }
        }

        // 5. Broad Search (Filtered)
        const wcSearchRes = await api.get("products", {
            search: idStr,
            per_page: 10,
            cache: "no-store"
        });

        if (Array.isArray(wcSearchRes.data) && wcSearchRes.data.length > 0) {
            // Explicit filter
            const validMatches = wcSearchRes.data.filter((p: any) => Number(p.id) !== numericExcludeId);

            // Prefer exact SKU match if possible
            const exactSku = validMatches.find((p: any) => String(p.sku).trim().toLowerCase() === idStr.toLowerCase());

            const match = exactSku || validMatches[0];

            if (match) {
                console.log(`[LOOKUP] ✅ Match WC Search: ${match.id}`);
                return { success: true, data: match };
            }
        }

        console.log(`[LOOKUP] ❌ NO RESULTS for "${idStr}"`);
        return { success: true, data: null };
    } catch (error: any) {
        console.error(`[LOOKUP] 🚨 ERROR: ${idStr}`, error.message);
        return { success: false, error: error?.message || "Internal server error" };
    }
}

export async function fetchProductsByIdentifiersAction(identifiers: string[], excludeId?: number) {
    if (!identifiers || identifiers.length === 0) return { success: true, data: [] };

    try {
        const results = await Promise.all(
            identifiers.map(id => fetchProductBySkuOrIdAction(id, excludeId))
        );

        const matchedItems: { query: string, product: any }[] = [];

        results.forEach((res, index) => {
            if (res.success && res.data && res.data.id) {
                if (!excludeId || Number(res.data.id) !== Number(excludeId)) {
                    matchedItems.push({
                        query: identifiers[index],
                        product: res.data
                    });
                }
            }
        });

        return { success: true, data: matchedItems };
    } catch (error: any) {
        return { success: false, error: error?.message || "Bulk fetch failed" };
    }
}


export async function refreshCartStockAction(productIds: number[]) {
    try {
        if (!productIds || productIds.length === 0) return { success: true, data: [] };
        const res = await api.get("products", { include: productIds, per_page: 50, cache: "no-store" });
        const updates = Array.isArray(res.data) ? res.data.map((p: any) => {
            const totalStockMeta = p.meta_data?.find((m: any) => m.key === "crucial_data_total_stock")?.value;
            const parsedStock = parseInt(totalStockMeta, 10);
            const totalStock = totalStockMeta !== undefined && totalStockMeta !== null && totalStockMeta !== "" && !isNaN(parsedStock) ? parsedStock : null;
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
        return { success: false, error: error?.message || "Failed to refresh stock" };
    }
}
