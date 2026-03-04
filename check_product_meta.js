const https = require('https');

const ck = 'ck_13140f6a16a11f40eb1e260c502c1130e2991d5c';
const cs = 'cs_bf4bccddc249fa39860284d7583e0df91cf32d8a';

https.get(`https://app.bouwbeslag.nl/wp-json/wc/v3/products?per_page=1&consumer_key=${ck}&consumer_secret=${cs}`, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const products = JSON.parse(data);
    if (products.length > 0) {
      console.log("Product:", products[0].name);
      console.log("Meta Data Keys:", products[0].meta_data.map(m => m.key).filter(k => k.includes('image')));
      console.log("Full Meta Data for image keys:", products[0].meta_data.filter(k => k.key.includes('image')));
    }
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
