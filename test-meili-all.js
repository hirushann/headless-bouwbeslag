require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "https://ezearch.dayzsolutions.com";
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || "";
const MEILISEARCH_PRODUCTS_INDEX = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || "empire-bouwbeslag-products";

async function run() {
    const endpoint = `${MEILISEARCH_HOST}/indexes/${MEILISEARCH_PRODUCTS_INDEX}/search`;
    
    let allProducts = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MEILISEARCH_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                q: "",
                limit: limit,
                offset: offset,
                attributesToRetrieve: ["slug", "updated_at"] // Only what we need for sitemap
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            allProducts = allProducts.concat(data.hits);
            
            if (data.hits.length < limit) {
                break;
            }
            offset += limit;
        } else {
            console.error("Error", res.status);
            break;
        }
    }
    
    console.log(`Successfully fetched ${allProducts.length} total products from Meilisearch.`);
}
run();
