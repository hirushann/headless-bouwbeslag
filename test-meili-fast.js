require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "https://ezearch.dayzsolutions.com";
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || "";
const MEILISEARCH_PRODUCTS_INDEX = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || "empire-bouwbeslag-products";

async function run() {
    const endpoint = `${MEILISEARCH_HOST}/indexes/${MEILISEARCH_PRODUCTS_INDEX}/search`;
    
    console.time("Meilisearch");
    const res = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${MEILISEARCH_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            q: "",
            limit: 10000,
            attributesToRetrieve: ["slug", "updated_at"]
        })
    });
    
    if (res.ok) {
        const data = await res.json();
        console.timeEnd("Meilisearch");
        console.log(`Found ${data.hits.length} items. Sample:`, data.hits[0]);
    } else {
        console.error("Error", res.status);
    }
}
run();
