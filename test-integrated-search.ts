
import { searchProducts } from './src/actions/search';

async function test() {
    try {
        const res = await searchProducts("8716075880912");
        if (res.products.length > 0) {
        } else {
        }
    } catch (e) {
        console.error("Error calling searchProducts:", e);
    }
}

test();
