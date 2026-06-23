const fs = require('fs');

async function test() {
    const res = await fetch('http://localhost:3001/api/category-filters?categorySlug=raamkruk&categoryId=5');
    const data = await res.json();
    const products = data.filterBaseProducts || [];
    let match = 0;
    products.forEach(p => {
        if (p.color === 'Zwart' && p.material === 'Messing') match++;
    });
    console.log("Products with Zwart AND Messing:", match);
}
test();
