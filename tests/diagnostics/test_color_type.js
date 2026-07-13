const fs = require('fs');

async function test() {
    const res = await fetch('http://localhost:3001/api/category-filters?categorySlug=raamkruk&categoryId=5');
    const data = await res.json();
    const products = data.filterBaseProducts || [];
    
    // Check type of p.color in the raw response
    const sample = products.find(p => p.color);
    if (sample) {
        console.log("p.color:", JSON.stringify(sample.color));
        console.log("typeof p.color:", typeof sample.color);
        console.log("Is Array?", Array.isArray(sample.color));
    } else {
        console.log("No product with color found");
    }
}
test();
