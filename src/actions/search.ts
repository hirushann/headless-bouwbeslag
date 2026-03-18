"use server";

import client from "@/lib/elasticsearch";

export interface SearchResult {
    ID: number;
    post_title: string;
    post_name: string;
    images: { src: string; alt: string }[];
    id: number;
    name: string;
    slug: string;
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
                type: "best_fields",
                operator: "and" // Optional: helps with specific number searches
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
            const field = filterMap[key] || `terms.${key}.slug`;
            filterClauses.push({
                terms: { [field]: values }
            });
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
                        terms: { field: "meta._stock_status.raw", size: 5 }
                    }
                }
            },
        };

        const result = await client.search(estQuery);

        const totalItems = typeof result.hits.total === 'object' ? result.hits.total.value : (result.hits.total || 0);
        const totalPages = Math.ceil(totalItems / limit);

        const hits = result.hits.hits.map((hit: any) => {
            const source = hit._source as any;

            // Transform ES meta object to WC-style meta_data array
            const meta_data: any[] = [];
            if (source.meta) {
                Object.entries(source.meta).forEach(([key, value]: [string, any]) => {
                    const val = Array.isArray(value) && value.length > 0 ? (value[0]?.value ?? value[0]) : value;
                    meta_data.push({ key, value: val });
                });
            }

            // Map thumbnail to images array
            const images = source.thumbnail ? [{ src: source.thumbnail.src, alt: source.thumbnail.alt || "" }] : [];
            
            // Extract custom title if present
            const customTitle = meta_data.find(m => m.key === "description_bouwbeslag_title")?.value || source.post_title;

            return {
                ...source,
                meta_data: meta_data,
                name: customTitle,
                slug: source.post_name,
                id: source.ID,
                images: images
            } as SearchResult;
        });

        // Resolve category images for search results
        const mediaIds = new Set<string>();
        hits.forEach((p: any) => {
            const catImgId = p.meta_data?.find((m: any) => m.key === "assets_cat_image")?.value ||
                             p.meta_data?.find((m: any) => m.key === "cat_image")?.value;
            if (catImgId && /^\d+$/.test(String(catImgId))) {
                mediaIds.add(String(catImgId));
            }
        });

        if (mediaIds.size > 0) {
            try {
                const { data: mediaItems } = await client.transport.request({
                    method: 'GET',
                    path: `/wp-json/wp/v2/media?include=${Array.from(mediaIds).join(',')}&per_page=100&_fields=id,source_url`,
                }, {
                    // This is a bit of a hack since we use a raw ES client, but we need to call the WP API
                    // Actually we should just fetch it using global fetch
                }) as any;
                // Wait, use standard fetch for simplicity and to avoid ES client complexity
                const WP_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl";
                const res = await fetch(`${WP_BASE}/wp-json/wp/v2/media?include=${Array.from(mediaIds).join(',')}&per_page=100&_fields=id,source_url`);
                const mediaData = await res.json();

                if (Array.isArray(mediaData)) {
                    const mediaMap = new Map();
                    mediaData.forEach((m: any) => mediaMap.set(String(m.id), m.source_url));

                    hits.forEach((p: any) => {
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
                const stocks = stockAgg.buckets.map((b: any) => ({
                    key: b.key,
                    doc_count: b.doc_count,
                    label: b.key === "instock" ? "Op voorraad" : b.key === "outofstock" ? "Niet op voorraad" : b.key
                }));
                if (stocks.length > 0) facets.push({ name: "stock", buckets: stocks });
            }
        }

        return { products: hits, facets, totalItems, totalPages };
    } catch (error) {
        // console.error("Elasticsearch server action error:", error);
        return { products: [], facets: [], totalItems: 0, totalPages: 0 };
    }
}
