const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
// Need to mock fetch since fetchAllWoo uses Node fetch which is built in.
// But fetchAllWoo is in TS, we can't easily require it in JS without transpile.
// I'll just write a quick script using native fetch to WooCommerce API.
