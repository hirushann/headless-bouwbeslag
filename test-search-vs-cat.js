require('dotenv').config({ path: '.env' });
const fetch = require('node-fetch');

async function test() {
  const host = process.env.MEILISEARCH_HOST || 'https://ezearch.dayzsolutions.com';
  const key = process.env.MEILISEARCH_KEY || '4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec';
  const index = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || 'empire-bouwbeslag-products';
  
  // 1. Search Payload
  const searchPayload = {
        q: "deurklink",
        limit: 1,
        offset: 0,
        facets: ["category_slug", "brand_name", "color", "material", "finish", "stock_status"]
  };

  const res1 = await fetch(`${host}/indexes/${index}/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(searchPayload)
  });
  const data1 = await res1.json();
  const searchHit = data1.hits[0];

  // 2. Category Payload
  const catPayload = {
        q: '',
        limit: 1,
        offset: 0,
        filter: [`category_slug = 'deurklink'`],
        attributesToRetrieve: [
          'id', 'slug', 'name', 'color', 'material', 'finish',
          'brand', 'brand_name', 'brand_id', 'stock_status', 'stock',
          'price', 'category_id', 'category_slug', 'category_name',
          'images', 'main_image_url', 'category'
        ],
  };
  const res2 = await fetch(`${host}/indexes/${index}/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(catPayload)
  });
  const data2 = await res2.json();
  const catHit = data2.hits[0];

  console.log("Search Hit category:", JSON.stringify(searchHit?.category));
  console.log("Cat Hit category:", JSON.stringify(catHit?.category));
  console.log("Search Hit images:", JSON.stringify(searchHit?.images?.slice(0, 1)));
  console.log("Cat Hit images:", JSON.stringify(catHit?.images?.slice(0, 1)));
}

test();
