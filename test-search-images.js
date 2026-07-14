require('dotenv').config({ path: '.env' });
const fetch = require('node-fetch');

async function test() {
  const host = process.env.MEILISEARCH_HOST || 'https://ezearch.dayzsolutions.com';
  const key = process.env.MEILISEARCH_KEY || '4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec';
  const index = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || 'empire-bouwbeslag-products';
  
  const searchPayload = {
        q: 'deurklink',
        limit: 5,
        offset: 0,
        facets: ["category_slug", "brand_name", "color", "material", "finish", "stock_status"]
  };

  const res = await fetch(`${host}/indexes/${index}/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(searchPayload)
  });
  const data = await res.json();
  
  data.hits.forEach((hit, i) => {
      console.log(`Product ${i}:`, hit.name);
      if (hit.images && hit.images.length > 0) {
          hit.images.forEach(img => {
              console.log(`  - type: ${img.type}, url: ${img.url}`);
          });
      } else {
          console.log(`  - No images array`);
      }
      console.log(`  - main_image_url: ${hit.main_image_url}`);
  });
}

test();
