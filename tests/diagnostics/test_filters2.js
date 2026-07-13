const fs = require('fs');

async function test() {
    const res = await fetch('http://localhost:3001/api/category-filters?categorySlug=raamkruk&categoryId=5');
    const data = await res.json();
    const products = data.filterBaseProducts || [];
    const attributes = data.attributes || [];
    
    const colorAttr = attributes.find(a => a.id === 9002);
    const zwartTerm = colorAttr.terms.find(t => t.name === 'Zwart');
    const witTerm = colorAttr.terms.find(t => t.name === 'Wit');

    const selectedFilters = { 9002: new Set([zwartTerm.id, witTerm.id]) };
    
    function matchesFilters(product, selectedFilters, allAttributes) {
        for (const [idStr, terms] of Object.entries(selectedFilters)) {
            const id = Number(idStr);
            const pAttr = product.attributes?.find(a => a.id === id);
            if (!pAttr) return false;
            const hasMatch = pAttr.options.some(o => {
                const globalAttr = allAttributes.find(ga => ga.id === id);
                const tMatch = globalAttr?.terms.find(t => t.name.trim().toLowerCase() === o.trim().toLowerCase());
                return tMatch && terms.has(tMatch.id);
            });
            if (!hasMatch) return false;
        }
        return true;
    }

    const matches = products.filter(p => matchesFilters(p, selectedFilters, attributes));
    console.log("Matched products for Zwart OR Wit:", matches.length);
}
test();
