require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "https://ezearch.dayzsolutions.com";
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || "";
const MEILISEARCH_PRODUCTS_INDEX = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || "empire-bouwbeslag-products";

async function run() {
    const endpoint = `${MEILISEARCH_HOST}/indexes/${MEILISEARCH_PRODUCTS_INDEX}/search`;
    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${MEILISEARCH_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            q: "J7010015",
            limit: 1,
        })
    });
    
    if (res.ok) {
        const data = await res.json();
        if (data.hits.length > 0) {
            const p = data.hits[0];
            console.log("Found:", p.name);
            console.log("price:", p.price);
            console.log("price_b2b:", p.price_b2b);
            console.log("price_b2c:", p.price_b2c);
            console.log("meta_data (prices):", p.meta_data ? p.meta_data.filter(m => m.key.includes('price')) : "No meta_data array");
        }
    } else {
        console.error("Error", res.status);
    }
}
run();
