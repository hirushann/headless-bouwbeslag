require('dotenv').config({ path: '.env' });
const fetch = require('node-fetch');

async function test() {
  const host = process.env.MEILISEARCH_HOST || 'https://ezearch.dayzsolutions.com';
  const key = process.env.MEILISEARCH_KEY;
  const index = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || 'empire-bouwbeslag-products';
  
  const catPayload = {
        q: '',
        limit: 1,
        offset: 0,
        filter: [`category_slug = deurklink`],
  };

  const res = await fetch(`${host}/indexes/${index}/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(catPayload)
  });
  const data = await res.json();
  console.log("No quotes hits:", data.hits ? data.hits.length : data);
}

test();
