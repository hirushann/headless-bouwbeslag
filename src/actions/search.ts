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
    limit: number = 24
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

    try {
        const estQuery: any = {
            index: process.env.ELASTICSEARCH_INDEX as string,
            body: {
                query: {
                    bool: {
                        must: must,
                        filter: filterClauses
                    },
                },
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
            const meta_data = source.meta ? Object.entries(source.meta).map(([key, value]: [string, any]) => {
                // Value in ES meta is typically an array of objects with 'value' property or just values?
                // Looking at dump: "_sku": [{"value":"123"}]
                // We want the primary value.
                const val = Array.isArray(value) && value.length > 0 ? value[0]?.value : value;
                return { key, value: val };
            }) : [];

            // Map thumbnail to images array
            const images = source.thumbnail ? [{ src: source.thumbnail.src, alt: source.thumbnail.alt || "" }] : [];

            return {
                ...source,
                meta_data: meta_data,
                name: source.post_title,
                slug: source.post_name,
                id: source.ID,
                images: images
            } as SearchResult;
        });

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
