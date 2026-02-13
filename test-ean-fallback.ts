
import { fetchProductBySkuOrIdAction } from './src/app/actions';

async function test() {
    console.log("Testing fetchProductBySkuOrIdAction for EAN 8716075880950...");
    const res = await fetchProductBySkuOrIdAction("8716075880950");
    console.log("Success:", res.success);
    if (res.data) {
        console.log("Found Product ID:", res.data.id);
        console.log("Found Product Name:", res.data.name);
    } else {
        console.log("Product not found.");
    }
}

test();
