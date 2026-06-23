const fs = require('fs');

async function test() {
    const res = await fetch('http://localhost:3001/api/category-filters?categorySlug=raamkruk&categoryId=5');
    const data = await res.json();
    const products = data.filterBaseProducts || [];
    
    // Find Zwart product
    const zwartProduct = products.find(p => p.attributes?.some(a => a.id === 9002 && a.options?.includes('Zwart')));
    if (zwartProduct) {
        console.log(JSON.stringify(zwartProduct.attributes, null, 2));
    } else {
        console.log("No Zwart product found!");
    }
}
test();
