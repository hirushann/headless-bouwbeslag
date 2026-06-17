import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import api from "./src/lib/woocommerce";

async function run() {
  const { data } = await api.get("products/2197");
  console.log("ID:", data.id);
  console.log("Cat Image:", data.meta_data.find((m: any) => m.key === "assets_cat_image" || m.key === "cat_image"));
  console.log("Categories:", data.categories);
}
run();
