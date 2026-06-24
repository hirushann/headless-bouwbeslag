"use server";

import api, { fetchAllWoo } from "@/lib/woocommerce";
import elasticClient from "@/lib/elasticsearch";
import { fetchMeiliProducts, mapMeiliToWooProduct } from "@/lib/meilisearch-products";

export async function fetchProductIndexAction() {
    try {
        const { products } = await fetchMeiliProducts(1000, 0, "", []);

        const index = products.map((p: any) => {
            const mapped = mapMeiliToWooProduct(p);
            
            const ids: string[] = [];
            if (p.id) ids.push(String(p.id).trim().toLowerCase());
            if (p.sku) ids.push(String(p.sku).trim().toLowerCase());
            
            if (p.meta_data && Array.isArray(p.meta_data)) {
                p.meta_data.forEach((m: any) => {
                    const k = m.key;
                    if (["crucial_data_product_ean_code", "_sku", "crucial_data_product_factory_sku", "ean_code", "ean"].includes(k)) {
                        if (m.value && typeof m.value === 'string' && m.value.trim() !== "") {
                            ids.push(m.value.trim().toLowerCase());
                        }
                    }
                });
            }

            return {
                id: mapped?.id || p.id,
                name: p.name,
                slug: p.slug,
                sku: p.sku || "",
                price: mapped?.price || "",
                regular_price: mapped?.regular_price || "",
                cat_image: mapped?.images?.[0]?.src || p.main_image_url || undefined,
                images: mapped?.images || [],
                identifiers: Array.from(new Set(ids))
            };
        });

        return { success: true, data: index };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}



export async function checkStockAction(identifier: string | number) {
    try {
        const idStr = String(identifier).trim();
        if (!idStr) return { success: false, error: "Product not found" };

        const EMPIRE_BASE_URL = (process.env.NEXT_PUBLIC_EMPIRE_API_URL || process.env.EMPIRE_BACKEND_API_URL || "http://empire.test").replace(/\/$/, "");
        
        const res = await fetch(`${EMPIRE_BASE_URL}/api/products/${encodeURIComponent(idStr)}/stock`, { 
            cache: "no-store",
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!res.ok) {
            return { success: false, error: "Product not found" };
        }
        
        const data = await res.json();
        
        // Mock the shape of WooCommerce product for the frontend component
        const wcMockProduct = {
            id: identifier,
            sku: data.sku,
            stock_status: data.total_stock > 0 ? "instock" : "outofstock",
            stock_quantity: data.total_stock,
            backorders: "notify", // Default for Bouwbeslag if backorders are allowed
            backorders_allowed: true, // We will just permit backorders/notify generally or map it
            meta_data: [
                {
                    key: "crucial_data_total_stock",
                    value: String(data.total_stock)
                }
            ]
        };

        return { success: true, data: wcMockProduct };
    } catch (error: any) {
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
                    query: (() => {
                        const shouldClauses: any[] = [
                            {
                                multi_match: {
                                    query: idStr,
                                    fields: [
                                        "meta._sku.value.keyword",
                                        "meta.crucial_data_product_ean_code.value.keyword",
                                        "meta.crucial_data_product_factory_sku.value.keyword",
                                        "meta.*.value.keyword"
                                    ],
                                    type: "best_fields"
                                }
                            }
                        ];
                        
                        if (!isNaN(Number(idStr))) {
                            shouldClauses.push({ term: { "ID": Number(idStr) } });
                        }

                        return {
                            bool: {
                                must: [{ match: { post_type: "product" } }],
                                should: shouldClauses,
                                minimum_should_match: 1,
                                filter: numericExcludeId ? [{ bool: { must_not: { term: { ID: numericExcludeId } } } }] : []
                            }
                        };
                    })()
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

    try {
        const results = await fetchProductsByIdentifiersAction(identifiers, excludeId);
        return results;
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


export async function refreshCartStockAction(items: { id: number; sku?: string }[]) {
    try {
        if (!items || items.length === 0) return { success: true, data: [] };

        const EMPIRE_BASE_URL = (process.env.NEXT_PUBLIC_EMPIRE_API_URL || process.env.EMPIRE_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");
        
        const res = await fetch(`${EMPIRE_BASE_URL}/api/products/batch-stock`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ items }),
            cache: "no-store"
        });

        if (!res.ok) throw new Error("Failed to fetch stock from Empire");

        const data = await res.json();
        return { success: true, data: data.data || [] };
    } catch (error: any) {
        console.error("Refresh cart stock error:", error?.message);
        return { success: false, error: error?.message || "Failed to refresh stock" };
    }
}

export async function fetchCategoriesAction() {
    try {
        const categories = await fetchAllWoo("products/categories", {
            per_page: 100,
            hide_empty: true,
            _fields: "id,name,slug,parent,image",
            next: { revalidate: 60 } // Sync changes within 60 seconds!
        });
        return { success: true, data: categories };
    } catch (error: any) {
        return { success: false, error: error?.message || "Failed to fetch categories" };
    }
}

/**
 * Fetch blogs from Empire API
 */
export async function fetchBlogsAction(page = 1, limit = 10) {
    try {
        const EMPIRE_BASE_URL = (process.env.NEXT_PUBLIC_EMPIRE_API_URL || process.env.EMPIRE_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");
        const res = await fetch(`${EMPIRE_BASE_URL}/api/blogs?page=${page}&limit=${limit}`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) throw new Error("Failed to fetch blogs");
        return { success: true, data: await res.json() };
    } catch (error: any) {
        console.error("fetchBlogsAction error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch a single blog by slug from Empire API
 */
export async function fetchBlogBySlugAction(slug: string) {
    try {
        const EMPIRE_BASE_URL = (process.env.NEXT_PUBLIC_EMPIRE_API_URL || process.env.EMPIRE_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");
        const res = await fetch(`${EMPIRE_BASE_URL}/api/blogs/${encodeURIComponent(slug)}`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) throw new Error("Blog not found");
        return { success: true, data: await res.json() };
    } catch (error: any) {
        console.error("fetchBlogBySlugAction error:", error);
        return { success: false, error: error.message };
    }
}
