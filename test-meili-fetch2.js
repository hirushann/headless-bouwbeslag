const https = require('https');

async function test() {
  const url = "https://ezearch.dayzsolutions.com/indexes/empire-bouwbeslag-products/search";
  const req = https.request(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer 4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec',
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
           console.log("meta_data found! Length:", product.meta_data.length);
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
