"use server";


import api, { fetchAllWoo } from "@/lib/woocommerce";

export async function fetchProductIndexAction() {
    try {
        // Fetch ALL products lightweight
        // We select fields: id, name, slug, sku, meta_data (to get EANs)
        // Note: fetchAllWoo handles pagination
        const allProducts = await fetchAllWoo("products", {
            status: "publish",
            _fields: "id,name,slug,sku,meta_data"
        });

        const targetMetaKeys = [
            "crucial_data_product_ean_code",
            "_sku",
            "crucial_data_product_factory_sku",
            "ean_code",
            "ean",
            "_global_unique_id",
            "global_unique_id",
            "gtin",
            "upc",
            "isbn",
            "_wpm_gtin_code",
            "_wpm_gtin",
            "_gtin",
            "_ean"
        ];

        // Transform to minimal index
        const index = allProducts.map((p: any) => {
            const identifiers = new Set<string>();

            // Add SKU
            if (p.sku) identifiers.add(String(p.sku).trim().toLowerCase());
            // Add ID
            identifiers.add(String(p.id));

            // Extract EANs/Identifiers from meta
            if (Array.isArray(p.meta_data)) {
                p.meta_data.forEach((m: any) => {
                    if (targetMetaKeys.includes(m.key) && m.value) {
                        identifiers.add(String(m.value).trim().toLowerCase());
                    }
                });
            }

            return {
                id: p.id,
                name: p.name,
                sku: p.sku,
                identifiers: Array.from(identifiers)
            };
        });

        return { success: true, data: index };
    } catch (error: any) {
        console.error("Failed to build product index:", error?.message);
        return { success: false, error: error?.message || "Failed to fetch index" };
    }
}



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
            "global_unique_id", // Added this based on user feedback
            "gtin",
            "upc",
            "isbn",
            "_wpm_gtin_code",
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

