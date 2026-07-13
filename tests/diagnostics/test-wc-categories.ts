import { WooCommerceClient } from "../../src/lib/woocommerce.js";
import { config } from "dotenv";

config({ path: ".env.local" });

const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string;
const CK = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY as string;
const CS = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET as string;

const api = new WooCommerceClient({
    url: WP_API_URL,
    consumerKey: CK,
    consumerSecret: CS,
    version: "wc/v3",
});

async function run() {
    try {
        const res = await api.get("products/categories", { per_page: 5 });
        console.log("WC Categories data:", res.data.map((c: any) => ({ name: c.name, image: c.image })));
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}
run();
