
const api = require('./src/lib/woocommerce').default;

async function debug() {
    try {
        const res = await api.get('products', { per_page: 5 });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

debug();
