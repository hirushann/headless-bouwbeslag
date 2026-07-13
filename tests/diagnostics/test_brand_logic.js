const fs = require('fs');

async function test() {
  const res = await fetch('http://localhost:3001/api/category-filters?categorySlug=raamkruk&categoryId=5');
  const data = await res.json();
  const attributes = data.attributes || [];
  const sourceProducts = data.filterBaseProducts || [];

  const brandCounts = new Map();
  sourceProducts.forEach(p => {
      if (p.brands && p.brands.length > 0) {
        p.brands.forEach((b) => {
          const id = Number(b.id);
          if (!brandCounts.has(id)) {
            brandCounts.set(id, { name: b.name, count: 0 });
          }
          brandCounts.get(id).count++;
        });
      }
  });
  
  const winlockEntry = Array.from(brandCounts.entries()).find(([id, b]) => b.name === 'Winlock');
  const selectedBrands = new Set([winlockEntry[0]]);
  
  function matchesFilters(product, selectedFilters, selectedBrands, excludeBrand) {
    if (!excludeBrand && selectedBrands.size > 0) {
      if (!product.brands || product.brands.length === 0) return false;
      const hasBrandMatch = product.brands.some((b) => selectedBrands.has(Number(b.id)));
      if (!hasBrandMatch) return false;
    }
    return true;
  }

  let matches = sourceProducts.filter(p => matchesFilters(p, {}, selectedBrands, undefined));
  
  const ids = matches.map(p => p.id);
  console.log(`Unique IDs: ${new Set(ids).size}`);
  console.log(`Total IDs: ${ids.length}`);
}
test();
