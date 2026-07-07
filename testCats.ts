require("dotenv").config({ path: ".env.local" });
const { fetchCategories } = require("./src/lib/woocommerce.ts");
const { fetchPosts } = require("./src/lib/woocommerce.ts");

async function run() {
    console.log("Fetching with Empire API...");
    const empireCats = await fetchCategories();
    console.log("Empire categories count:", empireCats.length); console.log("First cat:", empireCats[0]);

    console.log("Fetching with Woo API...");
    try {
        const wooCats = await fetchPosts();
        console.log("Woo categories count:", wooCats.data.length);
    } catch (e) {
        console.error("Woo API error:", e.message);
    }
}
run();
