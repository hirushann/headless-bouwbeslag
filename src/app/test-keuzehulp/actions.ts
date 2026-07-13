"use server";

import { fetchMeiliProducts, mapMeiliToWooProduct } from "@/lib/meilisearch-products";

export async function fetchKeuzehulpProductsAction(categorySlug: string) {
  try {
    const filters = [`category_slug = ${categorySlug}`];
    const { products, total } = await fetchMeiliProducts(500, 0, "", filters);

    // Map to WooCommerce-like format AND keep the raw Meilisearch fields
    // so the Keuzehulp filter can access flat fields like color, finish, material
    const mapped = products.map((p: any) => {
      const woo = mapMeiliToWooProduct(p);
      return {
        ...woo,
        // Preserve raw Meilisearch flat fields for keuzehulp filtering
        _raw_color: p.color || null,
        _raw_finish: p.finish || null,
        _raw_material: p.material || null,
      };
    });

    return { success: true, products: mapped, total };
  } catch (error: any) {
    console.error("Error fetching keuzehulp products:", error);
    return { success: false, products: [], total: 0 };
  }
}
