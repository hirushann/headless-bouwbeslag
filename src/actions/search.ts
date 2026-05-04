"use server";

import client from "@/lib/elasticsearch";
import { fetchProductIndexAction } from "@/app/actions";

export interface SearchResult {
    ID: number;
    post_title: string;
    post_name: string;
    images: { src: string; alt: string }[];
    id: number;
    name: string;
    slug: string;
    price?: string;
    regular_price?: string;
    meta_data?: { key: string; value: any }[];
    resolved_cat_image?: string;
}

export type FilterState = {
    [key: string]: string[];
};

export interface Facet {
    name: string;
    buckets: { key: string; doc_count: number; label?: string }[];
}

export interface SearchResponse {
    products: SearchResult[];
    facets: Facet[];
    totalItems: number;
    totalPages: number;
}

export async function searchProducts(
    query: string,
    filters: FilterState = {},
    page: number = 1,
    limit: number = 24,
    sortBy: string = ""
): Promise<SearchResponse> {
    // if (!query.trim()) return { products: [], facets: [] };

    const must: any[] = [
        { match: { post_type: "product" } },
    ];

    if (query.trim()) {
        must.push({
            multi_match: {
                query: query,
                fields: ["post_title^3", "post_content", "meta.*.value", "meta._sku.value^2",],
                type: "bool_prefix"
            },
        });
    }

    // Apply Filters
    const filterClauses: any[] = [];

    // Helper to map UI filter keys to ES fields
    const filterMap: { [key: string]: string } = {
        category: "terms.product_cat.slug",
        brand: "terms.product_brand.slug",
        stock: "meta._stock_status.raw",
        color: "terms.pa_color.slug" // Assuming pa_color exists similarly, checking dump... dump didn't show pa_color but standard WP uses it. 
        // If not present, it won't break, just empty.
    };

    Object.entries(filters).forEach(([key, values]) => {
        if (values.length > 0) {
            if (key === 'stock' && values.includes('instock')) {
                filterClauses.push({
                    bool: {
                        must: [
                            { term: { "meta._stock_status.raw": "instock" } }
                        ],
                        must_not: [
                            { range: { "meta._stock.long": { lte: 0 } } },
                            { range: { "meta._stock.double": { lte: 0 } } },
                            { range: { "meta.crucial_data_total_stock.long": { lte: 0 } } },
                            { range: { "meta.crucial_data_total_stock.double": { lte: 0 } } }
                        ]
                    }
                });
            } else {
                const field = filterMap[key] || `terms.${key}.slug`;
                filterClauses.push({
                    terms: { [field]: values }
                });
            }
        }
    });

    // Sorting Logic
    const sort: any[] = [];
    if (sortBy) {
        switch (sortBy) {
            case "price-low-high":
                sort.push({ "meta._price.double": { order: "asc" } });
                break;
            case "price-high-low":
                sort.push({ "meta._price.double": { order: "desc" } });
                break;
            case "title-asc":
                sort.push({ "post_title.sortable": { order: "asc" } });
                break;
            case "title-desc":
                sort.push({ "post_title.sortable": { order: "desc" } });
                break;
            case "latest":
                sort.push({ "post_date": { order: "desc" } });
                break;
            case "popularity":
                sort.push({ "meta.total_sales.long": { order: "desc" } });
                break;
        }
    }
    // Default sort by score (relevance) if query exists, otherwise maybe latest?
    if (sort.length === 0 && !query.trim()) {
        sort.push({ "post_date": { order: "desc" } });
    }

    try {
        const estQuery: any = {
            index: (process.env.SEARCH_INDEX || process.env.ELASTICSEARCH_INDEX || "appbouwbeslagnl-post-1") as string,
            body: {
                query: {
                    bool: {
                        must: must,
                        filter: filterClauses
                    },
                },
                sort: sort,
                size: limit,
                from: (page - 1) * limit,
                _source: ["post_title", "post_name", "ID", "meta", "terms", "thumbnail", "images"], // Need terms for potential display
                aggs: {
                    categories: {
                        terms: { field: "terms.product_cat.slug", size: 20 },
                        aggs: {
                            names: { terms: { field: "terms.product_cat.name.keyword", size: 1 } }
                        }
                    },
                    brands: {
                        terms: { field: "terms.product_brand.slug", size: 20 },
                        aggs: {
                            names: { terms: { field: "terms.product_brand.name.keyword", size: 1 } }
                        }
                    },
                    stock: {
                        filters: {
                            filters: {
                                instock: {
                                    bool: {
                                        must: [
                                            { term: { "meta._stock_status.raw": "instock" } }
                                        ],
                                        must_not: [
                                            { range: { "meta._stock.long": { lte: 0 } } },
                                            { range: { "meta._stock.double": { lte: 0 } } },
                                            { range: { "meta.crucial_data_total_stock.long": { lte: 0 } } },
                                            { range: { "meta.crucial_data_total_stock.double": { lte: 0 } } }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            },
        };

        const result = await client.search(estQuery);

        const totalItems = typeof result.hits.total === 'object' ? result.hits.total.value : (result.hits.total || 0);
        const totalPages = Math.ceil(totalItems / limit);

        const indexRes = await fetchProductIndexAction();
        const productIndex = indexRes.success ? indexRes.data : [];

        // 1. Initial mapping and stock data extraction
        let hits = result.hits.hits.map((hit: any) => {
            const source = hit._source as any;
            const meta_data: any[] = [];
            if (source.meta) {
                Object.entries(source.meta).forEach(([key, value]: [string, any]) => {
                    const val = Array.isArray(value) && value.length > 0 ? (value[0]?.value ?? value[0]) : value;
                    meta_data.push({ key, value: val });
                });
            }

            // Extract stock info for filtering
            const stock_status = meta_data.find(m => m.key === '_stock_status')?.value;
            const rawQty = meta_data.find(m => m.key === '_stock')?.value || meta_data.find(m => m.key === 'crucial_data_total_stock')?.value;
            const stock_quantity = rawQty !== undefined ? parseInt(rawQty, 10) : null;

            return { source, meta_data, stock_status, stock_quantity };
        });

        // 2. Client-side safety filter for stock
        if (filters.stock && filters.stock.includes('instock')) {
            hits = hits.filter((h: any) => {
                const qty = h.stock_quantity;
                const status = h.stock_status;
                if (qty !== null && !isNaN(qty) && qty <= 0) return false;
                if ((qty === null || isNaN(qty)) && status !== 'instock') return false;
                return true;
            });
        }

        // 3. Final transformation to SearchResult type
        const processedProducts: SearchResult[] = hits.map((h: any) => {
            const { source, meta_data } = h;
            const indexItem = productIndex?.find((p: any) => p.slug === source.post_name);
            
            const esImages = source.images && source.images.length > 0 ? source.images : (source.thumbnail?.src ? [{ src: source.thumbnail.src, alt: source.thumbnail?.alt || "" }] : []);
            const verifiedImages = indexItem?.images && indexItem.images.length > 0 ? indexItem.images : esImages;
            
            const customTitle = meta_data.find((m: any) => m.key === "description_bouwbeslag_title")?.value || source.post_title;
            const metaPrice = meta_data.find((m: any) => m.key === "_price")?.value || "0";
            const metaRegularPrice = meta_data.find((m: any) => m.key === "_regular_price")?.value || metaPrice;

            return {
                id: indexItem?.id || source.ID,
                name: customTitle,
                slug: source.post_name,
                sku: source.meta?._sku?.[0]?.value || source.meta?._sku || "",
                price: (indexItem as any)?.price || metaPrice,
                regular_price: (indexItem as any)?.regular_price || metaRegularPrice,
                sale_price: source.meta?._sale_price?.[0]?.value || source.meta?._sale_price || "",
                images: verifiedImages,
                meta_data,
                identifiers: Array.from(new Set([...(source.terms?.product_tag?.map((t: any) => t.slug) || []), ...(indexItem?.identifiers || [])])),
                stock_status: h.stock_status,
                stock_quantity: h.stock_quantity,
            } as SearchResult;
        });

        // 4. Fetch FRESH stock data from WooCommerce to ensure delivery notice accuracy
        if (processedProducts.length > 0) {
            try {
                const productIds = processedProducts.map(p => p.id).filter(id => id);
                if (productIds.length > 0) {
                    const WP_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl";
                    const CK = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
                    const CS = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;
                    
                    if (CK && CS) {
                        const auth = btoa(`${CK}:${CS}`);
                        const stockRes = await fetch(`${WP_BASE}/wp-json/wc/v3/products?include=${productIds.join(',')}&per_page=100&_fields=id,stock_status,stock_quantity,manage_stock`, {
                            headers: { 'Authorization': `Basic ${auth}` },
                            next: { revalidate: 60 } // Cache for 1 minute
                        });
                        const stockData = await stockRes.json();
                        
                        if (Array.isArray(stockData)) {
                            stockData.forEach((s: any) => {
                                const product = processedProducts.find(p => p.id === s.id);
                                if (product) {
                                    product.stock_status = s.stock_status;
                                    product.stock_quantity = s.stock_quantity;
                                }
                            });
                        }
                    }
                }
            } catch (stockErr) {
                // Fallback to ES data if WC fetch fails
            }
        }

        // Resolve category images for search results
        const mediaIds = new Set<string>();
        processedProducts.forEach((p: any) => {
            const catImgId = p.meta_data?.find((m: any) => m.key === "assets_cat_image")?.value ||
                             p.meta_data?.find((m: any) => m.key === "cat_image")?.value;
            if (catImgId && /^\d+$/.test(String(catImgId))) {
                mediaIds.add(String(catImgId));
            }
        });

        if (mediaIds.size > 0) {
            try {
                const WP_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl";
                const res = await fetch(`${WP_BASE}/wp-json/wp/v2/media?include=${Array.from(mediaIds).join(',')}&per_page=100&_fields=id,source_url`);
                const mediaData = await res.json();

                if (Array.isArray(mediaData)) {
                    const mediaMap = new Map();
                    mediaData.forEach((m: any) => mediaMap.set(String(m.id), m.source_url));

                    processedProducts.forEach((p: any) => {
                        const catImgId = p.meta_data?.find((m: any) => m.key === "assets_cat_image")?.value ||
                                         p.meta_data?.find((m: any) => m.key === "cat_image")?.value;
                        if (catImgId && mediaMap.has(String(catImgId))) {
                            p.resolved_cat_image = mediaMap.get(String(catImgId));
                        }
                    });
                }
            } catch (mediaErr) {
                // Silent fail
            }
        }

        // Process Facets
        const facets: Facet[] = [];

        if (result.aggregations) {
            // Categories
            const catAgg = result.aggregations.categories as any;
            if (catAgg && catAgg.buckets) {
                const cats = catAgg.buckets.map((b: any) => ({
                    key: b.key,
                    doc_count: b.doc_count,
                    label: b.names?.buckets?.[0]?.key || b.key
                }));
                if (cats.length > 0) facets.push({ name: "category", buckets: cats });
            }

            // Brands
            const brandAgg = result.aggregations.brands as any;
            if (brandAgg && brandAgg.buckets) {
                const brands = brandAgg.buckets.map((b: any) => ({
                    key: b.key,
                    doc_count: b.doc_count,
                    label: b.names?.buckets?.[0]?.key || b.key
                }));
                if (brands.length > 0) facets.push({ name: "brand", buckets: brands });
            }

            // Stock
            const stockAgg = result.aggregations.stock as any;
            if (stockAgg && stockAgg.buckets) {
                // For filters aggregation, buckets is an object keyed by our names
                const stocks = Object.entries(stockAgg.buckets)
                    .filter(([key]) => key === "instock")
                    .map(([key, b]: [string, any]) => ({
                        key,
                        doc_count: b.doc_count,
                        label: "Op voorraad"
                    }));
                if (stocks.length > 0) facets.push({ name: "stock", buckets: stocks });
            }
        }


        return { products: processedProducts, facets, totalItems, totalPages };
    } catch (error) {
        // console.error("Elasticsearch server action error:", error);
        return { products: [], facets: [], totalItems: 0, totalPages: 0 };
    }
}
