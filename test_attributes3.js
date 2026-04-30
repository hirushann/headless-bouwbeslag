const api = require('./src/lib/woocommerce.ts');
async function run() {
  require('dotenv').config({ path: '.env.local' });
  const url = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
  const auth = Buffer.from(`${process.env.NEXT_PUBLIC_WC_CONSUMER_KEY}:${process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET}`).toString('base64');
  const headers = { "Authorization": `Basic ${auth}` };
  
  // get category 32 products WITHOUT _fields
  const res = await fetch(`${url}/wp-json/wc/v3/products?category=32&per_page=10`, { headers });
  const data = await res.json();
  data.forEach(prod => {
     console.log(`Product ${prod.id} options count:`, prod.attributes.map(a => a.options.length).reduce((a,b)=>a+b, 0));
  })
}
run();
