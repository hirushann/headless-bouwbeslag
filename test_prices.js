const fs = require('fs');

async function test() {
    const res = await fetch('http://localhost:3001/api/category-filters?categorySlug=raamkruk&categoryId=5');
    const data = await res.json();
    const products = data.filterBaseProducts || [];
    let zeroPrice = 0;
    products.forEach(p => {
        let price = parseFloat(p.price) || 0;
        if (price === 0) zeroPrice++;
    });
    console.log("Total products:", products.length);
    console.log("Products with 0 price:", zeroPrice);
}
test();
