import { fetchProductBySlug } from './src/lib/meilisearch-products';

async function test() {
    const product = await fetchProductBySlug('glasplaatdrager-set-rvs-150mm');
    console.log(JSON.stringify(product?.attributes, null, 2));
}
test();
