const api = require('./src/lib/woocommerce.ts');
// since it's TS, I will write a simple node script using standard fetch.

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
const CK = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
const CS = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

async function run() {
  require('dotenv').config({ path: '.env.local' });
  const url = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
  const auth = Buffer.from(`${process.env.NEXT_PUBLIC_WC_CONSUMER_KEY}:${process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET}`).toString('base64');
  
  const headers = { "Authorization": `Basic ${auth}` };
  
  // get category 32 products
  const res = await fetch(`${url}/wp-json/wc/v3/products?category=32&per_page=1`, { headers });
  const data = await res.json();
  const prod = data[0];
  console.log("Product attributes:", JSON.stringify(prod.attributes, null, 2));

  // get terms for the first attribute
  if (prod.attributes.length > 0) {
      const attrId = prod.attributes.find(a => a.id > 0)?.id;
      if (attrId) {
        const tRes = await fetch(`${url}/wp-json/wc/v3/products/attributes/${attrId}/terms`, { headers });
        const terms = await tRes.json();
        console.log(`Global Terms for attr ${attrId}:`, JSON.stringify(terms.map(t => t.name), null, 2));
      }
  }
}
run();
