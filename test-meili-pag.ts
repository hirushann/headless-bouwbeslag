import { fetchMeiliProducts } from './src/lib/meilisearch-products';
async function test() {
    let offset = 0;
    while(true) {
        const res = await fetchMeiliProducts(1000, offset, "", ["is_active = true"]);
        console.log(`Offset ${offset}: ${res?.products?.length} products`);
        if (!res?.products || res.products.length < 1000) break;
        offset += 1000;
    }
}
test();
