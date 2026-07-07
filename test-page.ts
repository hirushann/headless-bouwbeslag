import { getBrands } from "./src/lib/woocommerce";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
    const brands = await getBrands();
    let brandCounts: Record<string, number> = {};
    try {
        const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'https://ezearch.dayzsolutions.com';
        const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || '4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec';
        const MEILI_INDEX = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || 'empire-bouwbeslag-products';
        
        const res = await fetch(`${MEILISEARCH_HOST}/indexes/${MEILI_INDEX}/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MEILISEARCH_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: '', limit: 0, facets: ['brand_name'] })
        });
        
        if (res.ok) {
            const data = await res.json();
            brandCounts = data.facetDistribution?.brand_name || {};
            console.log("brandCounts fetched successfully:", Object.keys(brandCounts).length);
        } else {
            console.log("error", await res.text());
        }
    } catch (e) {
        console.error(e);
    }

    const getCount = (name: string) => {
        if (brandCounts[name]) return brandCounts[name];
        const lowerName = name.toLowerCase();
        const key = Object.keys(brandCounts).find(k => k.toLowerCase() === lowerName);
        return key ? brandCounts[key] : 0;
    };

    console.log("JNF count:", getCount("JNF"));
}
run();
