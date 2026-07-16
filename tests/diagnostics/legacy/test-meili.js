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
      const product = json.hits.find(p => p.meta_data && p.meta_data.length > 0);
      if (product) {
        console.log("Found product:", product.slug);
        const usps = product.meta_data.filter(m => m.key.includes("usp") || m.key.includes("faq"));
        console.log("USPs & FAQs:", JSON.stringify(usps, null, 2));
      } else {
        console.log("No product with meta_data found.");
      }
    });
  });
  req.write(JSON.stringify({ limit: 100 }));
  req.end();
}
test();
