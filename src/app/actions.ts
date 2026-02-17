"use server";


import api, { fetchAllWoo } from "@/lib/woocommerce";

export async function fetchProductIndexAction() {
    try {
        console.log("[INDEX] Building/Fetching Full Product Index (Cached)...");
        // Fetch ALL products lightweight
        // We select fields: id, name, slug, sku, meta_data (to get EANs)
        // INCREASED CACHE: Revalidates every 1 hour (3600s) to be super fast. 
        // This is acceptable for related products which don't change often.
        const allProducts = await fetchAllWoo("products", {
            status: "publish",
            _fields: "id,name,slug,sku,meta_data",
            next: { revalidate: 3600 }
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
                    // Check strict key match
                    if (targetMetaKeys.includes(m.key) && m.value) {
                        identifiers.add(String(m.value).trim().toLowerCase());
                    }
                });
            }

            return {
                id: p.id,
                name: p.name,
                slug: p.slug, // Needed for links
                sku: p.sku,
                identifiers: Array.from(identifiers),
                // We keep enough data to render the link without another fetch
                images: p.images || [], // If available in restricted fields? No, need to ask for images
                attributes: p.attributes || [], // Order Colors needs this?
                // Actually, for Order Colors we need attributes. 
                // FETCHING full attributes for 5000 products might be heavy but let's try just ID first.
                // For now, let's keep it lightweight. The caller can fetch full product if needed.
            };
        });

        console.log(`[INDEX] Built index with ${index.length} products.`);
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
            // We'll trust the first valid hit that we can VERIFY
            let verifiedMatch: any = null;

            // Run all meta queries in parallel
            const metaQueryResults = await Promise.all(targetMetaKeys.map(async (key) => {
                try {
                    const wpRes = await api.get("wp/v2/products", {
                        meta_key: key,
                        meta_value: idStr,
                        _fields: "id",
                        per_page: 5, // Fetch a few to increase chance of finding the right one if duplicates or near-matches exist
                        cache: "no-store"
                    });
                    if (Array.isArray(wpRes.data) && wpRes.data.length > 0) {
                        return wpRes.data.map((hit: any) => ({ id: Number(hit.id), key }));
                    }
                } catch (e) { }
                return [];
            }));

            // Flatten results: [{id: 123, key: 'ean'}, {id: 456, key: 'ean'}]
            const candidates = metaQueryResults.flat();

            // Remove duplicates and exclude self
            const uniqueCandidates = Array.from(new Set(candidates.map(c => c.id)))
                .filter(id => id !== numericExcludeId)
                .map(id => candidates.find(c => c.id === id)!);

            // Verify each candidate until we find a match
            for (const candidate of uniqueCandidates) {
                try {
                    const finalRes = await api.get(`products/${candidate.id}`, { cache: "no-store" });
                    if (finalRes.data && finalRes.data.id) {
                        const p = finalRes.data;

                        // Strict Verification
                        const metaValid = p.meta_data && Array.isArray(p.meta_data) && p.meta_data.some((m: any) =>
                            String(m.value).trim().toLowerCase() === idStr.toLowerCase()
                        );
                        const skuValid = String(p.sku).trim().toLowerCase() === idStr.toLowerCase();

                        if (metaValid || skuValid) {
                            console.log(`[LOOKUP] ✅ Verified Match WP Meta/SKU (${candidate.key}): ${finalRes.data.id}`);
                            verifiedMatch = finalRes.data;
                            break; // Stop after first verified match
                        } else {
                            console.warn(`[LOOKUP] ⚠️ False positive from WP API for "${idStr}" -> Product ${p.id} does not match.`);
                        }
                    }
                } catch (e) { }
            }

            if (verifiedMatch) {
                return { success: true, data: verifiedMatch };
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
        /* 
           If WP Meta queries failed, use standard Woo search.
           Woo search checks Title, SKU, and Description.
           It does NOT reliably check meta data unless plugins like 'Advanced Woo Search' are active.
        */
        const wcSearchRes = await api.get("products", {
            search: idStr,
            per_page: 10,
            cache: "no-store",
            status: "publish"
        });

        if (Array.isArray(wcSearchRes.data) && wcSearchRes.data.length > 0) {
            // Explicit filter
            const validMatches = wcSearchRes.data.filter((p: any) => Number(p.id) !== numericExcludeId);

            // Check for EXACT match in SKU or Any Meta Field (EAN)
            const exactMatch = validMatches.find((p: any) => {
                // 1. Check SKU
                if (p.sku && String(p.sku).trim().toLowerCase() === idStr.toLowerCase()) return true;

                // 2. Check Meta Data (EANs)
                if (p.meta_data && Array.isArray(p.meta_data)) {
                    // Check if ANY meta value is exactly the search string
                    const foundMeta = p.meta_data.find((m: any) =>
                        m.value && String(m.value).trim().toLowerCase() === idStr.toLowerCase()
                    );
                    if (foundMeta) return true;
                }

                return false;
            });

            if (exactMatch) {
                console.log(`[LOOKUP] ✅ Match Search (Exact SKU/Meta): ${exactMatch.id}`);
                return { success: true, data: exactMatch };
            }

            // If no exact match found, warn but don't return fuzzy
            console.warn(`[LOOKUP] ❌ Search found ${validMatches.length} results but no exact SKU/Meta match for "${idStr}"`);
        }

        // 6. LAST RESORT: Server-Side Index Fallback
        // Because WP API meta filtering is often broken/unauthorized for guest requests,
        // and search doesn't index meta, we must check our own "All Product" index.
        console.warn(`[LOOKUP] ⚠️ Direct lookups failed for "${idStr}". Attempting Server-Side Product Index fallback...`);
        const indexRes = await fetchProductIndexAction();
        if (indexRes.success && Array.isArray(indexRes.data)) {
            // Find in index
            const indexMatch = indexRes.data.find((p: any) =>
                p.identifiers && p.identifiers.includes(idStr.toLowerCase()) && p.id !== numericExcludeId
            );

            if (indexMatch) {
                console.log(`[LOOKUP] ✅ Match Index Fallback: ${indexMatch.id} (${indexMatch.name})`);
                // Fetch full product now that we have the ID to be safe
                const finalRes = await api.get(`products/${indexMatch.id}`, { cache: "no-store" });
                return { success: true, data: finalRes.data };
            }
        } else {
            console.error("[LOOKUP] Index fetch failed or returned invalid data.");
        }

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

