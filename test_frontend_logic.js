const fs = require('fs');

async function test() {
  const res = await fetch('http://localhost:3001/api/category-filters?categorySlug=raamkruk&categoryId=5');
  const data = await res.json();
  const attributes = data.attributes || [];
  const sourceProducts = data.filterBaseProducts || [];

  console.log(`Loaded ${sourceProducts.length} base products.`);
  console.log(`Loaded ${attributes.length} attributes.`);

  const ZwartAttr = attributes.find(a => a.name === 'Kleur');
  if (!ZwartAttr) {
    console.log("No Kleur attribute found!");
    return;
  }
  
  const ZwartTerm = ZwartAttr.terms.find(t => t.name === 'Zwart');
  if (!ZwartTerm) {
    console.log("No Zwart term found!");
    return;
  }
  
  console.log(`Zwart ID is ${ZwartTerm.id}`);

  const selectedFilters = { 9002: new Set([ZwartTerm.id]) };
  
  // The matchesFilters logic exactly as in CategoryClient.tsx
  function matchesFilters(
    product,
    selectedFilters,
    selectedBrands,
    allAttributes,
    excludeAttrId
  ) {
    for (const [idStr, terms] of Object.entries(selectedFilters)) {
      const id = Number(idStr);
      if (id === excludeAttrId) continue;
      const pAttr = product.attributes?.find(a => a.id === id);
      if (!pAttr) return false;
      const hasMatch = pAttr.options.some(o => {
        const globalAttr = allAttributes.find(ga => ga.id === id);
        const tMatch = globalAttr?.terms.find(
          t => t.name.trim().toLowerCase() === o.trim().toLowerCase()
        );
        return tMatch && terms.has(tMatch.id);
      });
      if (!hasMatch) return false;
    }
    return true;
  }

  // Find matches
  let matches = sourceProducts.filter(p => matchesFilters(p, selectedFilters, new Set(), attributes, undefined));
  
  console.log(`Matches for Zwart: ${matches.length}`);
  if (matches.length > 0) {
      console.log(`First match name: ${matches[0].name}`);
  }
  
  // Calculate counts for Kleur
  let countZwart = 0;
  sourceProducts.forEach(p => {
      // simulate checkGlobalMatchLocal(p, 9002)
      if (matchesFilters(p, selectedFilters, new Set(), attributes, 9002)) {
          const pAttr = p.attributes?.find(a => a.id === 9002);
          if (pAttr && pAttr.options.some(o => o.trim().toLowerCase() === 'zwart')) {
              countZwart++;
          }
      }
  });
  console.log(`Calculated count for Zwart sidebar: ${countZwart}`);
  
}
test();
