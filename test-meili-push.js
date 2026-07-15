const https = require('https');

async function test() {
  const url = "https://ezearch.dayzsolutions.com/indexes/empire-bouwbeslag-products/documents";
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
      console.log(JSON.parse(data));
    });
  });
  
  const testDoc = {
    id: "test-meta-1",
    model_id: 999999,
    sku: "TEST-META-1",
    name: "Test Meta",
    meta_data: [{ key: "description_usp_1", value: "Test USP" }]
  };
  
  req.write(JSON.stringify([testDoc]));
  req.end();
}
test();
