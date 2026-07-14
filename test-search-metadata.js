require('dotenv').config({ path: '.env' });
const fetch = require('node-fetch');

async function test() {
  const host = process.env.MEILISEARCH_HOST || 'https://ezearch.dayzsolutions.com';
  const key = process.env.MEILISEARCH_KEY || '4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec';
  const index = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || 'empire-bouwbeslag-products';
  
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

  console.log("meta_data keys:", searchHit?.meta_data ? searchHit.meta_data.map(m => m.key).join(", ") : "no meta_data");
  console.log("cat image meta:", searchHit?.meta_data ? searchHit.meta_data.find(m => m.key === "assets_cat_image" || m.key === "cat_image") : "no meta_data");
}

test();
