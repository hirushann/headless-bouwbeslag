"use server";

import { mapMeiliToWooProduct } from "@/lib/meilisearch-products";

export interface SearchResult {
    ID?: number;
    post_title?: string;
    post_name?: string;
    images: { src: string; alt?: string }[];
    id: number;
    name: string;
    slug: string;
    price?: string;
    regular_price?: string;
    meta_data?: { key: string; value: any }[];
    resolved_cat_image?: string;
    stock_status?: string;
    stock_quantity?: number | null;
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

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "https://ezearch.dayzsolutions.com";
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || "4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec";
const MEILISEARCH_PRODUCTS_INDEX = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || "empire-bouwbeslag-products";

export async function searchProducts(
    query: string,
    filters: FilterState = {},
    page: number = 1,
    limit: number = 24,
    sortBy: string = ""
): Promise<SearchResponse> {
    const meiliFilters: string[] = [];

    const escapeVal = (val: string) => val.replace(/'/g, "\\'");

    if (filters.category && filters.category.length > 0) {
        const mapped = filters.category.map(v => `'${escapeVal(v)}'`);
        meiliFilters.push(`category_slug IN [${mapped.join(", ")}]`);
    }

    if (filters.brand && filters.brand.length > 0) {
        const mapped = filters.brand.map(v => `'${escapeVal(v)}'`);
        meiliFilters.push(`brand_name IN [${mapped.join(", ")}]`);
    }

    if (filters.color && filters.color.length > 0) {
        const mapped = filters.color.map(v => `'${escapeVal(v)}'`);
        meiliFilters.push(`color IN [${mapped.join(", ")}]`);
    }

    if (filters.material && filters.material.length > 0) {
        const mapped = filters.material.map(v => `'${escapeVal(v)}'`);
        meiliFilters.push(`material IN [${mapped.join(", ")}]`);
    }

    if (filters.finish && filters.finish.length > 0) {
        const mapped = filters.finish.map(v => `'${escapeVal(v)}'`);
        meiliFilters.push(`finish IN [${mapped.join(", ")}]`);
    }

    if (filters.stock && filters.stock.length > 0) {
        if (filters.stock.includes("instock")) {
            meiliFilters.push(`stock_status = 'in_stock'`);
        }
    }

    // Ensure we only retrieve active products
    meiliFilters.push(`is_active = true`);

    const sortClauses: string[] = [];
    if (sortBy) {
        switch (sortBy) {
            case "price-low-high":
                sortClauses.push("price_amount:asc");
                break;
            case "price-high-low":
                sortClauses.push("price_amount:desc");
                break;
            case "title-asc":
                sortClauses.push("name:asc");
                break;
            case "title-desc":
                sortClauses.push("name:desc");
                break;
            case "latest":
            case "popularity":
                sortClauses.push("updated_at:desc");
                break;
        }
    }

    const offset = (page - 1) * limit;

    const payload: any = {
        q: query,
        limit,
        offset,
        facets: ["category_slug", "brand_name", "color", "material", "finish", "stock_status"]
    };

    if (meiliFilters.length > 0) {
        payload.filter = meiliFilters;
    }
    if (sortClauses.length > 0) {
        payload.sort = sortClauses;
    }

    console.log("Sending Meilisearch Payload:", JSON.stringify(payload, null, 2));

    try {
        const res = await fetch(`${MEILISEARCH_HOST}/indexes/${MEILISEARCH_PRODUCTS_INDEX}/search`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MEILISEARCH_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error("Meilisearch error:", await res.text());
            return { products: [], facets: [], totalItems: 0, totalPages: 0 };
        }

        const data = await res.json();

        // 1. Map to frontend SearchResult
        const products = data.hits.map((hit: any) => {
            const wooProd = mapMeiliToWooProduct(hit);
            return {
                id: wooProd.id,
                name: wooProd.name,
                slug: wooProd.slug,
                price: wooProd.price,
                regular_price: wooProd.regular_price,
                images: wooProd.images,
                stock_status: wooProd.stock_status,
                stock_quantity: wooProd.stock_quantity,
                resolved_cat_image: hit.category?.image?.src || hit.category?.image || ""
            } as SearchResult;
        });

        // 2. Map Facets
        const facets: Facet[] = [];
        if (data.facetDistribution) {
            const mapFacet = (esName: string, meiliKey: string) => {
                if (data.facetDistribution[meiliKey]) {
                    const buckets = Object.entries(data.facetDistribution[meiliKey])
                        .map(([key, count]) => ({
                            key,
                            doc_count: count as number,
                            label: key
                        }))
                        // Sort by count descending
                        .sort((a, b) => b.doc_count - a.doc_count);

                    if (buckets.length > 0) {
                        facets.push({ name: esName, buckets });
                    }
                }
            };

            mapFacet("category", "category_slug");
            mapFacet("brand", "brand_name");
            mapFacet("color", "color");
            mapFacet("material", "material");
            mapFacet("finish", "finish");

            // Handle stock specially
            if (data.facetDistribution.stock_status && data.facetDistribution.stock_status.in_stock) {
                facets.push({
                    name: "stock",
                    buckets: [{
                        key: "instock",
                        doc_count: data.facetDistribution.stock_status.in_stock as number,
                        label: "Op voorraad"
                    }]
                });
            }
        }

        const totalItems = data.estimatedTotalHits || data.totalHits || data.hits.length;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        return { products, facets, totalItems, totalPages };

    } catch (e) {
        console.error("Search Action Error:", e);
        return { products: [], facets: [], totalItems: 0, totalPages: 0 };
    }
}
