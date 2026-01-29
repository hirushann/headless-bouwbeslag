"use server";

import client from "@/lib/elasticsearch";

export interface SearchResult {
  ID: number;
  post_title: string;
  post_name: string;
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
}

export async function searchProducts(
    query: string,
    filters: FilterState = {}
): Promise<SearchResponse> {
    // if (!query.trim()) return { products: [], facets: [] };

    const must: any[] = [
        { match: { post_type: "product" } },
    ];

    if (query.trim()) {
        must.push({
            multi_match: {
                query: query,
                fields: ["post_title^3", "post_content", "meta", "meta._sku.value"],
            },
        });
    }

    // Apply Filters
    const filterClauses: any[] = [];
    
    // Helper to map UI filter keys to ES fields
    const filterMap: { [key: string]: string } = {
        category: "terms.product_cat.slug",
        brand: "terms.product_brand.slug",
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
                size: 20, // Check how many we want
                _source: ["post_title", "post_name", "ID", "meta", "terms"], // Need terms for potential display
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
                    }
                }
            },
        };

        const result = await client.search(estQuery);

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

             return {
                 ...source,
                 meta_data: meta_data,
                 name: source.post_title,
                 slug: source.post_name,
                 id: source.ID
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
        }

        return { products: hits, facets };
    } catch (error) {
        console.error("Elasticsearch server action error:", error);
        return { products: [], facets: [] };
    }
}
