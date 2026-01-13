import api from "@/lib/woocommerce";
import { wpApi } from "@/lib/wordpress";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl";

  const staticPages = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    // { url: `${baseUrl}/products`, lastModified: new Date() },
    { url: `${baseUrl}/contact`, lastModified: new Date() },
    { url: `${baseUrl}/garantie-aanvraag`, lastModified: new Date() },
    { url: `${baseUrl}/hulp`, lastModified: new Date() },
    { url: `${baseUrl}/kennisbank`, lastModified: new Date() },
    { url: `${baseUrl}/laagste-prijs-garantie`, lastModified: new Date() },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date() },
    { url: `${baseUrl}/retourbeleid`, lastModified: new Date() },
    { url: `${baseUrl}/algemene-voorwaarden`, lastModified: new Date() },
    { url: `${baseUrl}/zakelijk-aanmelden`, lastModified: new Date() },
  ];

  // Helper to fetch ALL items with pagination
  // Updated to accept optional client, defaults to WC api
  const fetchAll = async (endpoint: string, extraParams = {}, client: any = api) => {
    let page = 1;
    let allItems: any[] = [];

    while (true) {
      try {
        const res = await client.get(endpoint, {
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

  // 1. Fetch All Categories First (needed for products lookup)
  const allCategories = await fetchAll("products/categories", { hide_empty: true });

  // Build category map for parent lookup
  const catMap = new Map();
  allCategories.forEach((cat: any) => catMap.set(cat.id, cat));

  // Helper to resolve full path
  const getCategoryPath = (catId: number): string => {
    let path = "";
    let currentId = catId;
    const visited = new Set(); // Prevent infinite loops

    while (currentId !== 0 && catMap.has(currentId) && !visited.has(currentId)) {
      visited.add(currentId);
      const cat = catMap.get(currentId);
      path = path ? `${cat.slug}/${path}` : cat.slug;
      currentId = cat.parent;
    }
    return path;
  };

  const categories = allCategories.map((cat: any) => ({
    url: `${baseUrl}/${getCategoryPath(cat.id)}`,
    lastModified: new Date(),
  }));

  // 2. Fetch All Products
  const allProducts = await fetchAll("products", { status: "publish" });

  const products = allProducts.map((product: any) => {
    const meta = product.meta_data || [];
    const acfSlug =
      meta.find((m: any) => m.key === "description_slug")?.value ||
      product.slug;

    // const finalSlug = nestedPath ? `${nestedPath}/${acfSlug}` : acfSlug;
    const finalSlug = acfSlug;

    return {
      url: `${baseUrl}/${finalSlug}`,
      lastModified: product.date_modified
        ? new Date(product.date_modified)
        : new Date(),
    };
  });

  // 3. Fetch All Blog Posts
  const allPosts = await fetchAll("posts", { status: "publish" }, wpApi);

  const posts = allPosts.map((post: any) => ({
    url: `${baseUrl}/kennisbank/${post.slug}`,
    lastModified: post.modified ? new Date(post.modified) : new Date(),
  }));

  return [...staticPages, ...categories, ...products, ...posts];
}