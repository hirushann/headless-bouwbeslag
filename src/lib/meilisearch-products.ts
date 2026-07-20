import { BOUWBESLAG_PRODUCT_TAGS } from "@/lib/cache-tags";
import { buildMeilisearchPagination, resolveMeilisearchTotal } from "@/lib/meilisearch-pagination";

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "https://ezearch.dayzsolutions.com";
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || "";
const MEILISEARCH_PRODUCTS_INDEX = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || "empire-bouwbeslag-products";

/**
 * Fetch products from Meilisearch with flexible filtering
 */
export async function fetchMeiliProducts(limit: number = 10, offset: number = 0, query: string = "", filters: string[] = [], sort?: string[]) {
    try {
        const body: any = {
            q: query,
            ...buildMeilisearchPagination(limit, offset),
        };

        if (filters && filters.length > 0) {
            body.filter = filters;
        }

        if (sort && sort.length > 0) {
            body.sort = sort;
        }

        const endpoint = `${MEILISEARCH_HOST}/indexes/${MEILISEARCH_PRODUCTS_INDEX}/search`;
        const request = () => fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MEILISEARCH_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            next: {
                revalidate: 300,
                tags: BOUWBESLAG_PRODUCT_TAGS,
            },
        } as any);

        let res = await request();
        if ([502, 503, 504].includes(res.status)) {
            // One bounded retry handles a transient reverse-proxy failure. Cached
            // successful responses remain available between revalidations.
            res = await request();
        }

        if (!res.ok) {
            console.warn(`[Meilisearch] Catalog temporarily unavailable (${res.status} ${res.statusText}).`);
            return { products: [], total: 0 };
        }

        const data = await res.json();
        
        // Return raw Meilisearch hits — callers use mapMeiliToWooProduct to convert
        const products = data.hits || [];
        
        return { 
            products, 
            total: resolveMeilisearchTotal(data, products.length),
        };
    } catch {
        console.warn("[Meilisearch] Catalog request failed; rendering the existing empty fallback.");
        return { products: [], total: 0 };
    }
}

/**
 * Fetch a single product by slug
 */
export async function fetchProductBySlug(slug: string) {
    console.log(`[DEBUG] fetchProductBySlug: Looking for slug '${slug}' in Meilisearch`);
    const { products } = await fetchMeiliProducts(1, 0, "", [`slug = '${slug}'`]);
    if (!products || products.length === 0) {
        console.warn(`[DEBUG] fetchProductBySlug: No product found for slug '${slug}'`);
        return null;
    }
    console.log(`[DEBUG] fetchProductBySlug: Found product for slug '${slug}'`);
    return mapMeiliToWooProduct(products[0]) || null;
}



export function mapMeiliToWooProduct(p: any) {
    if (!p) return null;

    const wooAttributes: any[] = [];
    
    const tryAddAttr = (key: string, name: string, slug?: string) => {
      if (p[key]) {
        wooAttributes.push({
          name,
          slug: slug || `pa_${key}`,
          options: Array.isArray(p[key]) ? p[key] : [p[key]]
        });
      }
    };

    tryAddAttr('color', 'Kleur');
    tryAddAttr('material', 'Materiaal');
    tryAddAttr('finish', 'Finish');
    tryAddAttr('brand_name', 'Merk');
    tryAddAttr('packing_type', 'Verpakkingstype', 'pa_packing_type');

    // Handle price
    let priceStr = "";
    let regularPriceStr = "";
    if (typeof p.price === 'object' && p.price !== null) {
        priceStr = p.price.amount?.toString() || "";
        regularPriceStr = p.price.amount?.toString() || "";
    } else if (p.price_amount !== undefined) {
        priceStr = p.price_amount?.toString();
    } else if (typeof p.price === 'string' || typeof p.price === 'number') {
        priceStr = p.price.toString();
    }

    // Handle images
    let images: any[] = [];
    if (Array.isArray(p.images) && p.images.length > 0) {
        images = p.images.map((img: any) => ({
            ...img,
            src: img.url || img.src
        }));
    } else if (p.main_image_url) {
        images = [{ src: p.main_image_url }];
    }

    return {
      ...p,
      attributes: wooAttributes,
      brands: p.brand_name 
        ? [{ id: p.brand_id || p.brand_name, name: p.brand_name, slug: p.brand_slug || String(p.brand_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') }] 
        : (p.brand ? [{ id: p.brand.id, name: p.brand.name, slug: p.brand.slug || String(p.brand.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') }] : []),
      price: priceStr,
      regular_price: regularPriceStr,
      stock_status: p.stock?.status === 'in_stock' ? 'instock' : (p.stock_status || 'outofstock'),
      stock_quantity: p.stock?.quantity ?? p.stock_quantity ?? null,
      backorders_allowed: true,
      images: images,
      meta_data: p.meta_data || [],
      resolved_cat_image: p.category?.image?.src || p.category?.image || ""
    };
}
