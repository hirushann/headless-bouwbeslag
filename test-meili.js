const { mapMeiliToWooProduct } = require('./src/lib/meilisearch-products');
const p = {
  "id": 10000001,
  "sku": "0142-01-048x50",
  "name": "Winlock raamkruk afsluitbaar links aluminium (f1) 8x50",
  "unit_price": 27.87,
  "stock": 1,
  "category": ["Raamkruk"]
};
console.log(mapMeiliToWooProduct(p));
