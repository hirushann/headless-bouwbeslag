import { searchProducts } from "../../src/actions/search";

async function run() {
    const res = await searchProducts("", { color: ["Zwart"] }, 1, 24, "");
    console.log(`Found ${res.totalItems} products.`);
}
run();
