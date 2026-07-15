const https = require('https');

async function test() {
  const url = "https://ezearch.dayzsolutions.com/indexes/empire-bouwbeslag-products/documents/test-meta-1";
  const req = https.request(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer 4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec',
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(JSON.parse(data));
    });
  });
  
  req.end();
}
test();
