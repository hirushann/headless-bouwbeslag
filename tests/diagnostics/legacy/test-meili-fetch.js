const https = require('https');

async function test() {
  const url = "https://ezearch.dayzsolutions.com/indexes/empire-bouwbeslag-products/documents/test-meta-1";
  const req = https.request(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + (process.env.MEILISEARCH_KEY || ''),
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
