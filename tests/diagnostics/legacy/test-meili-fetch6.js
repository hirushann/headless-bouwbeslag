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
        console.log("Found product slug:", product.slug);
      }
    });
  });
  
  req.write(JSON.stringify({ q: 'glasplaatdrager-150mm' }));
  req.end();
}
test();
