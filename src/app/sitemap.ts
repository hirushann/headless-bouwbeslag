import api from "@/lib/woocommerce";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl";

  const staticPages = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/products`, lastModified: new Date() },
  ];

  // Helper to fetch ALL items with pagination
  const fetchAll = async (endpoint: string, extraParams = {}) => {
    let page = 1;
    let allItems: any[] = [];

    while (true) {
      try {
        const res = await api.get(endpoint, {
          per_page: 100,
          page: page,
          ...extraParams
        });

        const data = Array.isArray(res?.data) ? res.data : [];
        if (data.length === 0) break;

        allItems = [...allItems, ...data];
        page++;

        // Safety break to prevent infinite loops (e.g. 50 pages = 5000 products)
        if (page > 50) break;
      } catch (e) {
        console.error(`Error fetching page ${page} of ${endpoint}:`, e);
        break;
      }
    }
    return allItems;
  };

  // 1. Fetch All Products
  const allProducts = await fetchAll("products", { status: "publish" });

  const products = allProducts.map((product: any) => {
    const meta = product.meta_data || [];
    const acfSlug =
      meta.find((m: any) => m.key === "description_slug")?.value ||
      product.slug;

    return {
      url: `${baseUrl}/${acfSlug}`,
      lastModified: product.date_modified
        ? new Date(product.date_modified)
        : new Date(),
    };
  });

  // 2. Fetch All Categories
  const allCategories = await fetchAll("products/categories", { hide_empty: true });

  const categories = allCategories.map((cat: any) => ({
    url: `${baseUrl}/${cat.slug}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...categories, ...products];
}