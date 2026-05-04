import { searchProducts } from './src/actions/search';

async function test() {
    console.log("Testing searchProducts with stock filter...");
    const query = "beslag";
    const filters = { stock: ["instock"] };
    const results = await searchProducts(query, filters);
    
    console.log(`Total found: ${results.total}`);
    console.log("First 5 results:");
    results.products.slice(0, 5).forEach(p => {
        console.log(`- ${p.name} (ID: ${p.id})`);
        console.log(`  Stock Status: ${p.stock_status}`);
        console.log(`  Stock Qty: ${p.stock_quantity}`);
        console.log(`  Meta Keys: ${p.meta_data.map(m => m.key).join(', ')}`);
    });
}

test().catch(console.error);
