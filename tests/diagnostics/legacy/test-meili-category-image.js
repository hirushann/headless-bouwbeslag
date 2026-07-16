require('dotenv').config({ path: '.env' });
const fetch = require('node-fetch');

async function test() {
  const host = process.env.MEILISEARCH_HOST || 'https://ezearch.dayzsolutions.com';
  const key = process.env.MEILISEARCH_KEY;
  const index = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || 'empire-bouwbeslag-products';
  
  const searchPayload = {
        q: '',
        limit: 100,
        offset: 0
  };

  const res = await fetch(`${host}/indexes/${index}/search`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(searchPayload)
  });
  const data = await res.json();
  
  const hasCatImage = data.hits.filter(h => h.category && h.category.image);
  console.log("Hits with category.image:", hasCatImage.length);
  if (hasCatImage.length > 0) {
      console.log(JSON.stringify(hasCatImage[0].category.image));
  }
}

test();
