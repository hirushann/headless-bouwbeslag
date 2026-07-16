require('dotenv').config({ path: '.env' });
const fetch = require('node-fetch');

async function test() {
  const host = process.env.MEILISEARCH_HOST || 'https://ezearch.dayzsolutions.com';
  const key = process.env.MEILISEARCH_KEY;
  const index = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || 'empire-bouwbeslag-products';
  
  const catPayload = {
        q: '',
        limit: 5,
        offset: 0,
        filter: [`category_slug = 'deurklink'`],
  };

  const res = await fetch(`${host}/indexes/${index}/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(catPayload)
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
