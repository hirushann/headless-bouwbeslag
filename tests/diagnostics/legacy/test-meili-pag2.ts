import { fetchMeiliProducts } from '../../../src/lib/meilisearch-products';
async function test() {
    const res = await fetchMeiliProducts(2000, 0, "", ["is_active = true"]);
    console.log(`Limit 2000: ${res?.products?.length} products`);
}
test();
