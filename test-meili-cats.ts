import { config } from "dotenv";
config({ path: ".env.local" });

import { fetchMeiliProducts } from "./src/lib/meilisearch-products.ts";

async function run() {
    const { products } = await fetchMeiliProducts(1, 0, "", []);
    console.log("First product:", JSON.stringify(products[0], null, 2));
}
run();
