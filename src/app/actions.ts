"use server";


import api, { fetchAllWoo } from "@/lib/woocommerce";
import elasticClient from "@/lib/elasticsearch";

export async function fetchProductIndexAction() {
    try {
        // Fetch ALL products lightweight
        // We select fields: id, name, slug, sku, meta_data (to get EANs)
        // INCREASED CACHE: Revalidates every 1 hour (3600s) to be super fast. 
        const allProducts = await fetchAllWoo("products", {
            status: "publish",
            _fields: "id,name,slug,sku,meta_data,images",
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

        return { success: true, data: index };
    } catch (error: any) {
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

export async function fetchBrandImageUrlAction(brandId: number) {
    try {
        const brandRes = await api.get(`products/brands/${brandId}`, { next: { revalidate: 3600 } });
        const brandData = brandRes.data;

        // WooCommerce brand object format -> image: { src: "..." }
        if (brandData?.image?.src) {
            return { success: true, data: brandData.image.src };
        }

        // Fallback to ACF if for some reason native WC image is missing
        if (brandData?.acf?.brand_logo) {
            let logoUrl = null;
            const logoData = brandData.acf.brand_logo;

            if (typeof logoData === 'number' || !isNaN(Number(logoData))) {
                try {
                    const mediaRes = await api.get(`wp/v2/media/${logoData}`, { next: { revalidate: 3600 } });
                    logoUrl = mediaRes.data?.source_url || null;
                } catch (e: any) {
                    console.error(`[BRAND] Error fetching ACF media:`, e.message);
                }
            } else if (typeof logoData === 'string') {
                logoUrl = logoData;
            } else if (logoData?.url) {
                logoUrl = logoData.url;
            }
            if (logoUrl) {
                return { success: true, data: logoUrl };
            }
        }

        return { success: true, data: null };
    } catch (error: any) {
        console.error(`[BRAND] Action Error:`, error.message);
        return { success: false, error: error?.message || "Failed to fetch brand image" };
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
        const skuRes = await api.get("products", { sku: idStr, per_page: 1, next: { revalidate: 3600 }, status: "publish" });
        if (Array.isArray(skuRes.data) && skuRes.data.length > 0) {
            const match = skuRes.data[0];
            if (match && Number(match.id) !== numericExcludeId) {
                // console.log(`[LOOKUP] ✅ Match SKU (Woo): ${match.id}`);
                return { success: true, data: match };
            }
        }

        // 3. Parallel WP Meta/Elasticsearch Query
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

        try {
            // A. Try Elasticsearch FIRST (Fastest)
            const esIndex = process.env.SEARCH_INDEX || process.env.ELASTICSEARCH_INDEX;
            if (esIndex) {
                const esRes = await elasticClient.search({
                    index: esIndex,
                    size: 1,
                    query: {
                        bool: {
                            must: [
                                { match: { post_type: "product" } },
                                {
                                    multi_match: {
                                        query: idStr,
                                        fields: [
                                            "ID",
                                            "meta._sku.value.keyword",
                                            "meta.crucial_data_product_ean_code.value.keyword",
                                            "meta.crucial_data_product_factory_sku.value.keyword",
                                            "meta.*.value.keyword"
                                        ],
                                        type: "best_fields"
                                    }
                                }
                            ],
                            filter: numericExcludeId ? [{ bool: { must_not: { term: { ID: numericExcludeId } } } }] : []
                        }
                    }
                });

                if (esRes.hits.hits.length > 0) {
                    const hit: any = esRes.hits.hits[0]._source;
                    // We need full WC product data, so we still fetch by ID once, but now we have the ID directly!
                    const finalRes = await api.get(`products/${hit.ID}`, { next: { revalidate: 3600 } });
                    if (finalRes.data && finalRes.data.id) {
                        return { success: true, data: finalRes.data };
                    }
                }
            }

            // B. Fallback to slow WP Meta Query
            let verifiedMatch: any = null;

            // Run all meta queries in parallel
            const metaQueryResults = await Promise.all(targetMetaKeys.map(async (key) => {
                try {
                    const wpRes = await api.get("wp/v2/products", {
                        meta_key: key,
                        meta_value: idStr,
                        _fields: "id",
                        per_page: 5, // Fetch a few to increase chance of finding the right one if duplicates or near-matches exist
                        next: { revalidate: 3600 }
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
                    const finalRes = await api.get(`products/${candidate.id}`, { next: { revalidate: 3600 } });
                    if (finalRes.data && finalRes.data.id) {
                        const p = finalRes.data;

                        // Strict Verification
                        const metaValid = p.meta_data && Array.isArray(p.meta_data) && p.meta_data.some((m: any) =>
                            String(m.value).trim().toLowerCase() === idStr.toLowerCase()
                        );
                        const skuValid = String(p.sku).trim().toLowerCase() === idStr.toLowerCase();

                        if (metaValid || skuValid) {
                            // console.log(`[LOOKUP] ✅ Verified Match WP Meta/SKU (${candidate.key}): ${finalRes.data.id}`);
                            verifiedMatch = finalRes.data;
                            break; // Stop after first verified match
                        } else {
                            // console.warn(`[LOOKUP] ⚠️ False positive from WP API for "${idStr}" -> Product ${p.id} does not match.`);
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
                const idRes = await api.get(`products/${numericId}`, { next: { revalidate: 3600 } });
                if (idRes.data && idRes.data.id) {
                    // console.log(`[LOOKUP] ✅ Match ID: ${idRes.data.id}`);
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
            next: { revalidate: 3600 },
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
                // console.log(`[LOOKUP] ✅ Match Search (Exact SKU/Meta): ${exactMatch.id}`);
                return { success: true, data: exactMatch };
            }

            // If no exact match found, warn but don't return fuzzy
            // console.warn(`[LOOKUP] ❌ Search found ${validMatches.length} results but no exact SKU/Meta match for "${idStr}"`);
        }

        // 6. LAST RESORT: Database has no exact match.
        // Do not use fetchProductIndexAction here as it hangs the server fetching 5000 products.
        // If it's not in Woo search or exact meta match, we return null.

        return { success: true, data: null };
    } catch (error: any) {
        // console.error(`[LOOKUP] 🚨 ERROR: ${idStr}`, error.message);
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

/**
 * Highly optimized batch fetch for related products (Order Models/Colors)
 * Uses the Server-Side Index FIRST to avoid 100+ API calls for meta lookups.
 */
export async function fetchRelatedProductsBatchAction(identifiers: string[], excludeId?: number) {
    if (!identifiers || identifiers.length === 0) return { success: true, data: [] };

    const cleanIds = identifiers.map(id => String(id).trim().toLowerCase());
    const foundMap = new Map<string, any>(); // Map original query -> product

    try {
        // 1. FAST FETCH: Try fetching via WooCommerce API using comma-separated SKUs
        // WC API supports `sku` with multiple values separated by commas, making this insanely fast!
        const skuString = cleanIds.join(",");
        const skuRes = await api.get("products", {
            sku: skuString,
            per_page: 100,
            status: "publish",
            next: { revalidate: 3600 }
        });

        if (Array.isArray(skuRes.data)) {
            skuRes.data.forEach((p: any) => {
                if (p.sku && p.id !== excludeId) {
                    const skuLower = String(p.sku).trim().toLowerCase();
                    // Map back to original query based on EXACT SKU match
                    identifiers.forEach(id => {
                        if (String(id).trim().toLowerCase() === skuLower) {
                            foundMap.set(id, p);
                        }
                    });
                }
            });
        }

        // 2. MEDIUM FETCH: Resolve missing items via Elasticsearch (SINGLE BATCH QUERY)
        const missingQueries = identifiers.filter(q => !foundMap.has(q));
        if (missingQueries.length > 0) {
            const esIndex = process.env.SEARCH_INDEX || process.env.ELASTICSEARCH_INDEX;
            if (esIndex) {
                const esRes = await elasticClient.search({
                    index: esIndex,
                    size: missingQueries.length * 2,
                    query: {
                        bool: {
                            must: [{ match: { post_type: "product" } }],
                            should: [
                                { terms: { "ID": missingQueries } },
                                { terms: { "meta._sku.value.keyword": missingQueries } },
                                { terms: { "meta.crucial_data_product_ean_code.value.keyword": missingQueries } },
                                { terms: { "meta.crucial_data_product_factory_sku.value.keyword": missingQueries } },
                                {
                                    multi_match: {
                                        query: missingQueries.join(" "),
                                        fields: ["meta.*.value.keyword"],
                                        type: "best_fields"
                                    }
                                }
                            ],
                            minimum_should_match: 1,
                            filter: excludeId ? [{ bool: { must_not: { term: { ID: excludeId } } } }] : []
                        }
                    }
                });

                if (esRes.hits.hits.length > 0) {
                    // Fetch full WooCommerce data for these in parallel
                    const matchedIDs = esRes.hits.hits.map((h: any) => h._source.ID);

                    const fullProducts = await Promise.all(
                        matchedIDs.map(id => api.get(`products/${id}`, { next: { revalidate: 3600 } }).then(r => r.data).catch(() => null))
                    );

                    const validProducts = fullProducts.filter(Boolean);

                    // Resolve category images for these batch products
                    const mediaIds = new Set<string>();
                    validProducts.forEach((p: any) => {
                        const catImgId = p.meta_data?.find((m: any) => m.key === "assets_cat_image")?.value ||
                            p.meta_data?.find((m: any) => m.key === "cat_image")?.value;
                        if (catImgId && /^\d+$/.test(String(catImgId))) {
                            mediaIds.add(String(catImgId));
                        }
                    });

                    if (mediaIds.size > 0) {
                        try {
                            const mediaRes = await api.get('wp/v2/media', {
                                include: Array.from(mediaIds).join(','),
                                per_page: 100,
                                _fields: 'id,source_url'
                            });
                            if (Array.isArray(mediaRes.data)) {
                                const mediaMap = new Map();
                                mediaRes.data.forEach((m: any) => mediaMap.set(String(m.id), m.source_url));

                                validProducts.forEach((p: any) => {
                                    const catImgId = p.meta_data?.find((m: any) => m.key === "assets_cat_image")?.value ||
                                        p.meta_data?.find((m: any) => m.key === "cat_image")?.value;
                                    if (catImgId && mediaMap.has(String(catImgId))) {
                                        p.resolved_cat_image = mediaMap.get(String(catImgId));
                                    }
                                });
                            }
                        } catch (e) { }
                    }

                    validProducts.forEach((p: any) => {
                        // Map back to ALL queries that might match this product
                        const pId = String(p.id);
                        const pSku = String(p.sku).trim().toLowerCase();
                        const pMeta = (p.meta_data || []).map((m: any) => String(m.value).trim().toLowerCase());

                        identifiers.forEach(q => {
                            const cq = String(q).trim().toLowerCase();
                            if (cq === pId || cq === pSku || pMeta.includes(cq)) {
                                foundMap.set(q, p);
                            }
                        });
                    });
                }
            }

            // 3. SLOW FETCH fallback (only for things still missing)
            const remainingQueries = identifiers.filter(q => !foundMap.has(q));
            if (remainingQueries.length > 0) {
                const fallbackResults = await Promise.all(
                    remainingQueries.map(id => fetchProductBySkuOrIdAction(id, excludeId))
                );

                fallbackResults.forEach((res, i) => {
                    if (res.success && res.data && res.data.id !== excludeId) {
                        foundMap.set(remainingQueries[i], res.data);
                    }
                });
            }
        }

        // 3. Return mapped results in original identifiers order (to slot correctly)
        const finalResults = identifiers.map(id => {
            const match = foundMap.get(id);
            return match ? { query: id, product: match } : null;
        }).filter(Boolean);

        return { success: true, data: finalResults };

    } catch (e: any) {
        console.error("[BATCH] Error:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Resolves a slug to a type (product/category) and its ID using Elasticsearch.
 * This is 10x faster than querying WooCommerce by slug.
 */
export async function resolveSlugAction(slug: string) {
    if (!slug) return { success: false, type: null, id: null };

    const esIndex = process.env.SEARCH_INDEX || process.env.ELASTICSEARCH_INDEX;
    if (!esIndex) return { success: false, type: null, id: null };

    try {
        // 1. Try to find a PRODUCT with this slug (post_name)
        const productRes = await elasticClient.search({
            index: esIndex,
            size: 1,
            query: {
                bool: {
                    must: [
                        { term: { post_type: "product" } },
                        { term: { "post_name.keyword": slug } }
                    ]
                }
            }
        });

        if (productRes.hits.hits.length > 0) {
            const hit: any = productRes.hits.hits[0]._source;
            return { success: true, type: 'product', id: hit.ID, data: hit };
        }

        // 2. Try to find if it's a CATEGORY
        // Note: Many ES setups don't index categories as primary docs.
        // We'll do a quick check in products to see if any product HAS this category slug.
        const categoryCheck = await elasticClient.search({
            index: esIndex,
            size: 1,
            query: {
                bool: {
                    must: [
                        { term: { "terms.product_cat.slug": slug } }
                    ]
                }
            }
        });

        if (categoryCheck.hits.hits.length > 0) {
            // We found a product with this category, so it's likely a valid category slug.
            // We still need the real Category ID from Woo, but at least we know it's a category!
            return { success: true, type: 'category', id: null };
        }

        return { success: false, type: null, id: null };
    } catch (e) {
        return { success: false, type: null, id: null };
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

