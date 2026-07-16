const https = require('https');

async function test() {
  const url = "https://ezearch.dayzsolutions.com/indexes/empire-bouwbeslag-products/search";
  const req = https.request(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + (process.env.MEILISEARCH_KEY || ''),
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      console.log("Total hits:", json.hits.length);
      const product = json.hits[0];
      if (product) {
        console.log("Keys:", Object.keys(product));
      }
    });
  });
  req.write(JSON.stringify({ limit: 10 }));
  req.end();
}
test();
