import { fetchCategories, getBrands } from './src/lib/woocommerce';
import { fetchMeiliProducts } from './src/lib/meilisearch-products';

async function test() {
    try {
        const cats = await fetchCategories();
        console.log("Categories:", cats?.length);
        const brands = await getBrands();
        console.log("Brands:", brands?.length);
        const res = await fetchMeiliProducts(1000, 0, "", ["is_active = true"]);
        console.log("Products:", res?.products?.length);
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}
test();
