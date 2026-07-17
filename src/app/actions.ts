"use server";

import api, { fetchAllWoo } from "@/lib/woocommerce";
import elasticClient from "@/lib/elasticsearch";
import { fetchMeiliProducts, mapMeiliToWooProduct } from "@/lib/meilisearch-products";
import { BOUWBESLAG_BLOG_TAGS } from "@/lib/cache-tags";

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
            manage_stock: true,
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

    try {
        // Query Meilisearch directly instead of hitting the deprecated WooCommerce API
        const { products } = await fetchMeiliProducts(50, 0, idStr, []);

        if (products && products.length > 0) {
            for (const p of products) {
                if (numericExcludeId && Number(p.id) === numericExcludeId) continue;

                const skuValid = p.sku && String(p.sku).trim().toLowerCase() === idStr.toLowerCase();
                
                let metaValid = false;
                if (p.meta_data && Array.isArray(p.meta_data)) {
                    metaValid = p.meta_data.some((m: any) =>
                        m.value && String(m.value).trim().toLowerCase() === idStr.toLowerCase()
                    );
                }

                if (skuValid || metaValid || String(p.id) === idStr) {
                    const wooProduct = mapMeiliToWooProduct(p);
                    if (wooProduct) {
                        return { success: true, data: wooProduct };
                    }
                }
            }
        }

        return { success: true, data: null };
    } catch (error: any) {
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


export async function refreshCartStockAction(items: { id: string | number; sku?: string }[]) {
    try {
        if (!items || items.length === 0) return { success: true, data: [] };

        const EMPIRE_BASE_URL = (process.env.NEXT_PUBLIC_EMPIRE_API_URL || process.env.EMPIRE_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");
        
        const skus = items.map((item) => item.sku).filter((sku): sku is string => Boolean(sku));
        if (skus.length === 0) return { success: true, data: [] };

        const res = await fetch(`${EMPIRE_BASE_URL}/api/products/batch-stock`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({ skus }),
            cache: "no-store"
        });

        if (!res.ok) throw new Error("Failed to fetch stock from Empire");

        const data = await res.json();
        const updates = items.flatMap((item) => {
            if (!item.sku || !data[item.sku]?.found) return [];
            const stock = data[item.sku];
            return [{
                id: item.id,
                stockStatus: Number(stock.total_stock) > 0 ? "instock" : "outofstock",
                stockQuantity: Number(stock.total_stock) || 0,
                leadTimeInStock: stock.delivery_if_stock ? String(stock.delivery_if_stock) : undefined,
                leadTimeNoStock: stock.delivery_if_no_stock ? String(stock.delivery_if_no_stock) : undefined,
            }];
        });
        return { success: true, data: updates };
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
            next: { revalidate: 3600, tags: BOUWBESLAG_BLOG_TAGS }
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
            next: { revalidate: 3600, tags: BOUWBESLAG_BLOG_TAGS }
        });
        if (!res.ok) throw new Error("Blog not found");
        return { success: true, data: await res.json() };
    } catch (error: any) {
        console.error("fetchBlogBySlugAction error:", error);
        return { success: false, error: error.message };
    }
}
