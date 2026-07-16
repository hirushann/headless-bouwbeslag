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
      if (json.hits && json.hits.length > 0) {
         let withMeta = 0;
         json.hits.forEach(p => {
             if (p.meta_data && p.meta_data.length > 0) withMeta++;
         });
         console.log(`Out of ${json.hits.length}, ${withMeta} have meta_data.`);
      }
    });
  });
  
  req.write(JSON.stringify({ q: '' }));
  req.end();
}
test();
