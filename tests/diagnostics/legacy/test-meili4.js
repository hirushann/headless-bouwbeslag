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
      const product = json.hits[0];
      if (product) {
        console.log("Keys:", Object.keys(product));
        if (product.meta_data) {
           console.log("meta_data:", JSON.stringify(product.meta_data, null, 2));
        } else {
           console.log("NO META DATA!");
        }
      }
    });
  });
  req.write(JSON.stringify({ q: 'J2023700' }));
  req.end();
}
test();
