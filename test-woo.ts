import api from './src/lib/woocommerce';

async function test() {
    try {
        const res = await api.get('products/categories');
        console.log("Categories:", res?.data?.length);
    } catch (e: any) {
        console.log("Cat error:", e.message);
    }
    try {
        const res = await api.get('products');
        console.log("Products:", res?.data?.length);
    } catch (e: any) {
        console.log("Prod error:", e.message);
    }
}
test();
