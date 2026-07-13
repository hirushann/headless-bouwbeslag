async function test() {
  const res = await fetch('http://localhost:3001/api/category-filters?categorySlug=raamkruk&categoryId=5');
  const data = await res.json();
  const sourceProducts = data.filterBaseProducts || [];

  const winlockProducts = sourceProducts.filter(p => p.brand_name === 'Winlock' || (p.brands && p.brands.some(b => b.name === 'Winlock')));
  
  console.log(`Found ${winlockProducts.length} Winlock products.`);
  winlockProducts.slice(0, 10).forEach((p, i) => {
    console.log(`Product ${i}: id=${p.id}, name=${p.name}`);
  });
}
test();
