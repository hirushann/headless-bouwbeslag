import api from "@/lib/woocommerce";
import { wpApi } from "@/lib/wordpress";
import { MetadataRoute } from "next";

function normalizeBaseUrl(input: string) {
  // remove trailing slash
  return input.replace(/\/+$/, "");
}

function normalizeUrl(url: string) {
  // remove trailing slash except for the homepage
  if (url.endsWith("/") && !url.match(/^https?:\/\/[^/]+\/$/)) {
    return url.replace(/\/+$/, "");
  }
  return url;
}

// Woo client: params are passed directly (common for Woo REST wrappers)
async function fetchAllWoo(endpoint: string, extraParams: any = {}, client: any = api) {
  let page = 1;
  const allItems: any[] = [];

  while (true) {
    try {
      const res = await client.get(endpoint, {
        per_page: 100,
        page,
        ...extraParams,
      });

      const data = Array.isArray(res?.data) ? res.data : [];
      if (!data.length) break;

      allItems.push(...data);
      page++;

      // safety break
      if (page > 50) break;
    } catch (e: any) {
      const msg = (e?.message || "").toLowerCase();
      if (msg.includes("page number is larger") || msg.includes("paginanummer is groter")) break;
      console.error(`Error fetching page ${page} of ${endpoint}:`, e);
      break;
    }
  }

  return allItems;
}

// WP client (axios-style): params should be under `params`
async function fetchAllWp(endpoint: string, extraParams: any = {}, client: any = wpApi) {
  let page = 1;
  const allItems: any[] = [];

  while (true) {
    try {
      const res = await client.get(endpoint, {
        params: {
          per_page: 100,
          page,
          ...extraParams,
        },
      });

      const data = Array.isArray(res?.data) ? res.data : [];
      if (!data.length) break;

      allItems.push(...data);
      page++;

      if (page > 50) break;
    } catch (e: any) {
      // WP returns 400 when page is out of bounds
      const status = e?.response?.status;
      if (status === 400) break;

      console.error(`Error fetching WP page ${page} of ${endpoint}:`, e);
      break;
    }
  }

  return allItems;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl");
  const now = new Date();

  // 1) Categories (Deep Hierarchy)
  const allCategories = await fetchAllWoo("products/categories", { hide_empty: false });

  // Build a map for fast parent lookup
  const catMap = new Map();
  allCategories.forEach((cat: any) => catMap.set(cat.id, cat));

  // Recursive function to build path: parent/child/grandchild
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

  const categories: MetadataRoute.Sitemap = allCategories
    .filter((c: any) => c?.slug)
    .map((cat: any) => ({
      url: normalizeUrl(`${baseUrl}/${getCategoryPath(cat.id)}`),
      lastModified: cat?.date_modified ? new Date(cat.date_modified) : now,
    }));

  // 2) Products (Woo)
  const allProducts = await fetchAllWoo("products", { status: "publish" });

  const products: MetadataRoute.Sitemap = allProducts
    .filter((p: any) => p?.slug && p?.status === "publish")
    .filter((p: any) => p?.catalog_visibility !== "hidden")
    .map((product: any) => {
      const meta = product.meta_data || [];
      const acfSlug = meta.find((m: any) => m.key === "description_slug")?.value || product.slug;
      return {
        url: normalizeUrl(`${baseUrl}/${acfSlug}`), // Products are at root or specific slug as per previous setup
        lastModified: product?.date_modified ? new Date(product.date_modified) : now,
      };
    });

  // 3) Blog posts (WordPress)
  const allPosts = await fetchAllWp("wp/v2/posts", { status: "publish" });

  const posts: MetadataRoute.Sitemap = allPosts
    .filter((p: any) => p?.slug && p?.status === "publish")
    .map((post: any) => ({
      url: normalizeUrl(`${baseUrl}/kennisbank/${post.slug}`),
      lastModified: post?.modified ? new Date(post.modified) : now,
    }));

  // 4) Brands (WordPress)
  const allBrands = await fetchAllWp("wp/v2/product_brand", { hide_empty: true });

  const brands: MetadataRoute.Sitemap = allBrands
    .filter((b: any) => b?.slug)
    .map((brand: any) => ({
      url: normalizeUrl(`${baseUrl}/merken/${brand.slug}`),
      lastModified: brand?.modified ? new Date(brand.modified) : now,
    }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: now },
    { url: `${baseUrl}/contact`, lastModified: now },
    { url: `${baseUrl}/garantie-aanvraag`, lastModified: now },
    { url: `${baseUrl}/hulp`, lastModified: now },
    { url: `${baseUrl}/kennisbank`, lastModified: now },
    { url: `${baseUrl}/laagste-prijs-garantie`, lastModified: now },
    { url: `${baseUrl}/privacy-policy`, lastModified: now },
    { url: `${baseUrl}/retourbeleid`, lastModified: now },
    { url: `${baseUrl}/algemene-voorwaarden`, lastModified: now },
    { url: `${baseUrl}/zakelijk-aanmelden`, lastModified: now },
    { url: `${baseUrl}/merken`, lastModified: now },
  ].map((x) => ({ ...x, url: normalizeUrl(x.url) }));

  // Deduplicate
  const combined = [...staticPages, ...categories, ...products, ...posts, ...brands];
  const seen = new Set<string>();
  const unique = combined.filter((item) => {
    const key = item.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
}