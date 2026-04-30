const api = require('./src/lib/woocommerce.ts');
async function run() {
  require('dotenv').config({ path: '.env.local' });
  const url = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
  const auth = Buffer.from(`${process.env.NEXT_PUBLIC_WC_CONSUMER_KEY}:${process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET}`).toString('base64');
  const headers = { "Authorization": `Basic ${auth}` };
  
  const res = await fetch(`${url}/wp-json/wc/v3/products/1935`, { headers });
  const prod = await res.json();
  console.log("Keys:", Object.keys(prod));
  console.log("Attributes:", JSON.stringify(prod.attributes, null, 2));
}
run();
