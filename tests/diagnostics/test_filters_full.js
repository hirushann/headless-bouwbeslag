const fs = require('fs');

async function test() {
    const res = await fetch('http://localhost:3001/api/category-filters?categorySlug=raamkruk&categoryId=5');
    const data = await res.json();
    const allCategoryProductsForFilters = data.filterBaseProducts || [];
    const unwrappedAttributes = data.attributes || [];
    
    // Initial state
    const selectedFilters = {};
    const selectedBrands = new Set();
    const afdichtingsspleetRange = null;
    const groefbreedteRange = null;
    const showOnlyInStock = false;
    const priceRange = null;
    const isB2B = false;

    // Simulate selecting 'Zwart'
    const colorAttr = unwrappedAttributes.find(a => a.id === 9002);
    const zwartTerm = colorAttr.terms.find(t => t.name === 'Zwart');
    selectedFilters[9002] = new Set([zwartTerm.id]);
    
    function matchesFilters(product, selectedFilters, selectedBrands, allAttributes, afdichtingsspleetRange, groefbreedteRange, showOnlyInStock, priceRange, isB2B, excludeAttrId, excludeBrand) {
      if (showOnlyInStock) {
        const qty = product.stock_quantity;
        if (qty !== null && qty <= 0) return false;
        if (qty === null && product.stock_status !== 'instock') return false;
      }
      if (!excludeBrand && selectedBrands.size > 0) {
        if (!product.brands || product.brands.length === 0) return false;
        const hasBrandMatch = product.brands.some((b) => selectedBrands.has(Number(b.id)));
        if (!hasBrandMatch) return false;
      }
      for (const [idStr, terms] of Object.entries(selectedFilters)) {
        const id = Number(idStr);
        if (id === excludeAttrId) continue;
        const pAttr = product.attributes?.find((a) => a.id === id);
        if (!pAttr) return false;
        const hasMatch = pAttr.options.some((o) => {
          const globalAttr = allAttributes.find(ga => ga.id === id);
          const tMatch = globalAttr?.terms.find(
            (t) => t.name.trim().toLowerCase() === o.trim().toLowerCase()
          );
          return tMatch && terms.has(tMatch.id);
        });
        if (!hasMatch) return false;
      }
      return true;
    }

    const checkGlobalMatchLocal = (p, excludeAttrId, excludeBrand) => matchesFilters(p, selectedFilters, selectedBrands, unwrappedAttributes, afdichtingsspleetRange, groefbreedteRange, showOnlyInStock, priceRange, isB2B, excludeAttrId, excludeBrand);
    const checkGlobalMatch = (p) => matchesFilters(p, selectedFilters, selectedBrands, unwrappedAttributes, afdichtingsspleetRange, groefbreedteRange, showOnlyInStock, priceRange, isB2B);

    // Calculate count for Zwart
    const productsPassingOtherFilters = allCategoryProductsForFilters.filter(p => checkGlobalMatchLocal(p, 9002));
    const termCounts = new Map();
    productsPassingOtherFilters.forEach(p => {
        const pAttr = p.attributes?.find(a => a.id === 9002);
        if (pAttr) {
            const seenInProduct = new Set();
            pAttr.options?.forEach(o => {
                const key = o.trim().toLowerCase();
                if (!seenInProduct.has(key)) {
                    seenInProduct.add(key);
                    termCounts.set(key, (termCounts.get(key) || 0) + 1);
                }
            });
        }
    });

    const countForZwart = termCounts.get('zwart') || 0;
    
    // Calculate matched products
    const matches = allCategoryProductsForFilters.filter(p => checkGlobalMatch(p));
    
    console.log("Count shown on sidebar:", countForZwart);
    console.log("Matched products for grid:", matches.length);
}
test();
