
import { searchProducts } from './src/actions/search';

async function test() {
    try {
        // console.log("Searching for EAN 8716075880912...");
        const res = await searchProducts("8716075880912");
        // console.log("Results count:", res.products.length);
        if (res.products.length > 0) {
            // console.log("First result ID:", res.products[0].id);
            // console.log("First result name:", res.products[0].name);
        } else {
            // console.log("No results found in ES.");
        }
    } catch (e) {
        console.error("Error calling searchProducts:", e);
    }
}

test();
