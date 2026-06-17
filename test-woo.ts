import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { fetchAllWoo } from "./src/lib/woocommerce";
async function run() {
  const allProducts = await fetchAllWoo("products", {
      status: "publish",
      per_page: 5,
      _fields: "id,name,meta_data"
  });
  if (!allProducts || allProducts.length === 0) { console.log("No products"); return; }
  console.log("ID:", allProducts[0].id);
  console.log("Has assets_cat_image?", allProducts[0].meta_data.some((m: any) => m.key === 'assets_cat_image'));
  console.log("Keys:", allProducts[0].meta_data.map((m: any) => m.key).join(", "));
}
run();
