const https = require('https');

https.get('https://app.bouwbeslag.nl/wp-json/wc/v3/products/categories?parent=131&per_page=100&consumer_key=ck_13140f6a16a11f40eb1e260c502c1130e2991d5c&consumer_secret=cs_bf4bccddc249fa39860284d7583e0df91cf32d8a', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    console.log(JSON.parse(data).map(c => c.name));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
