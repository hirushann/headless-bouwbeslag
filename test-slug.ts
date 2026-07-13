import { fetchProductBySlug } from "./src/lib/meilisearch-products";

async function main() {
  const p = await fetchProductBySlug("winlock_raamkruk_afsluitbaar_links_aluminium_f1_8_x_50");
  console.log(p);
}
main();
