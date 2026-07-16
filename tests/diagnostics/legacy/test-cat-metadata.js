require('dotenv').config({ path: '.env' });
const fetch = require('node-fetch');

async function test() {
  const host = process.env.MEILISEARCH_HOST || 'https://ezearch.dayzsolutions.com';
  const key = process.env.MEILISEARCH_KEY;
  const index = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || 'empire-bouwbeslag-products';
  
  const catPayload = {
        q: '',
        limit: 10,
        offset: 0,
        filter: [`category_slug = 'deurklink'`],
  };

  const res = await fetch(`${host}/indexes/${index}/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(catPayload)
  });
  const data = await res.json();
  
  for (let i = 0; i < data.hits.length; i++) {
     const hit = data.hits[i];
     if (hit.meta_data) {
         console.log(`Hit ${i} has meta_data! keys:`, hit.meta_data.map(m => m.key).join(", "));
     } else {
         console.log(`Hit ${i} has NO meta_data`);
     }
  }
}

test();
