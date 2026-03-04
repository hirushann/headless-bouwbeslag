const https = require('https');
const ck = 'ck_13140f6a16a11f40eb1e260c502c1130e2991d5c';
const cs = 'cs_bf4bccddc249fa39860284d7583e0df91cf32d8a';

https.get(`https://app.bouwbeslag.nl/wp-json/wc/v3/products?per_page=50&consumer_key=${ck}&consumer_secret=${cs}`, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const products = JSON.parse(data);
    products.forEach(p => {
       const found = p.meta_data.filter(m => m.key.includes('cat_image'));
       if (found.length > 0) {
         console.log(`Product ID: ${p.id}, Name: ${p.name}`);
         console.log(`Matches:`, found);
       }
    });
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
