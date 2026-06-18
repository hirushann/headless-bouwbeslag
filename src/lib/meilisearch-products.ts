const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "https://ezearch.dayzsolutions.com";
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || "4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec";
const MEILISEARCH_PRODUCTS_INDEX = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || "empire-bouwbeslag-products";

/**
 * Fetch products from Meilisearch
 */
export async function fetchMeiliProducts(limit: number = 10, offset: number = 0, query: string = "") {
    try {
        const res = await fetch(`${MEILISEARCH_HOST}/indexes/${MEILISEARCH_PRODUCTS_INDEX}/search`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MEILISEARCH_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                q: query,
                limit,
                offset
            }),
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!res.ok) {
            console.error("Failed to fetch from Meilisearch:", res.status, res.statusText);
            return [];
        }

        const data = await res.json();
        
        // Map Meilisearch products to WooCommerce structure for ProductCard compatibility
        return (data.hits || []).map(mapMeiliProductToWoo);
    } catch (error) {
        console.error("Error fetching from Meilisearch:", error);
        return [];
    }
}

/**
 * Maps a Meilisearch product to the WooCommerce structure expected by the frontend components.
 */
function mapMeiliProductToWoo(meiliProduct: any) {
    return {
        id: meiliProduct.model_id || meiliProduct.id,
        name: meiliProduct.name,
        slug: meiliProduct.slug,
        sku: meiliProduct.sku,
        price: meiliProduct.price?.amount?.toString() || "0",
        regular_price: meiliProduct.price?.amount?.toString() || "0",
        stock_status: meiliProduct.stock?.status === "in_stock" ? "instock" : "outofstock",
        stock_quantity: meiliProduct.stock?.quantity || 0,
        images: [
            { src: meiliProduct.main_image_url }
        ],
        attributes: [
            {
                name: "Brand",
                options: [meiliProduct.brand?.name || ""]
            }
        ],
        meta_data: [
            // Dummy meta data to satisfy delivery time checks in ProductCard
            // If Meilisearch has actual delivery times, they should be mapped here
            { key: "crucial_data_delivery_if_stock", value: "1" },
            { key: "crucial_data_delivery_if_no_stock", value: "30" },
        ]
    };
}
