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
            q: "",
            limit: 200,
            filter: ["type = 'grouped' OR type = 'composite' OR type = 'set' OR type = 'bundle'"]
        })
    });
    
    if (res.ok) {
        const data = await res.json();
        console.log(`Found ${data.hits.length} items.`);
        if (data.hits.length > 0) {
            console.log(data.hits[0].slug, data.hits[0].type);
        }
    } else {
        const txt = await res.text();
        console.error("Error", res.status, txt);
    }
}
run();
