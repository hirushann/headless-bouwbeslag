require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function run() {
    const apiUrl = (process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test").replace(/\/+$/, "") + "/api";
    console.log(`Fetching from ${apiUrl}/sitemap/urls`);
    const res = await fetch(`${apiUrl}/sitemap/urls`);
    if (res.ok) {
        const data = await res.json();
        console.log(`Products in backend sitemap: ${data.products ? data.products.length : 0}`);
        if (data.products && data.products.length > 0) {
            console.log(data.products[0]);
        }
    } else {
        console.error("Error", res.status);
    }
}
run();
