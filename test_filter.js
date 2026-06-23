const fs = require('fs');

const d = JSON.parse(fs.readFileSync('out.json', 'utf8'));
const allAttributes = d.attributes;
const products = d.filterBaseProducts;

// Simulating selectedFilters = { 9002: Set([ 90028674 ]) } // "Aluminium" ID
const selectedFilters = { 9002: new Set([ 90028674 ]) };
const excludeAttrId = undefined;

function matchesFilters(product, selectedFilters, allAttributes, excludeAttrId) {
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

const matches = products.filter(p => matchesFilters(p, selectedFilters, allAttributes, excludeAttrId));
console.log("Matches for Aluminium:", matches.length);
