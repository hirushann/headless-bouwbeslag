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
      // console.error(`Error fetching page ${page} of ${endpoint}:`, e);
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

      // console.error(`Error fetching WP page ${page} of ${endpoint}:`, e);
      break;
    }
  }

  return allItems;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl");
  const now = new Date();

  // Parallel fetch of all data sources
  const [categoriesRes, productsRes, postsRes, brandsRes] = await Promise.allSettled([
    // 1) Categories
    fetchAllWoo("products/categories", {
      hide_empty: false, // Adjusted to match original logic or intended logic
      _fields: "id,slug,parent,date_modified"
    }),
    // 2) Products
    fetchAllWoo("products", {
      status: "publish",
      _fields: "id,slug,date_modified,status,catalog_visibility,meta_data"
    }),
    // 3) Blog posts
    fetchAllWp("wp/v2/posts", {
      status: "publish",
      _fields: "slug,modified"
    }),
    // 4) Brands
    fetchAllWp("wp/v2/product_brand", {
      hide_empty: true,
      _fields: "slug,modified"
    })
  ]);

  const allCategories = categoriesRes.status === "fulfilled" ? categoriesRes.value : [];
  const allProducts = productsRes.status === "fulfilled" ? productsRes.value : [];
  const allPosts = postsRes.status === "fulfilled" ? postsRes.value : [];
  const allBrands = brandsRes.status === "fulfilled" ? brandsRes.value : [];

  // Log errors if any
  if (categoriesRes.status === "rejected") console.error("Sitemap: Failed to fetch categories", categoriesRes.reason);
  if (productsRes.status === "rejected") console.error("Sitemap: Failed to fetch products", productsRes.reason);
  if (postsRes.status === "rejected") console.error("Sitemap: Failed to fetch posts", postsRes.reason);
  if (brandsRes.status === "rejected") console.error("Sitemap: Failed to fetch brands", brandsRes.reason);

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

  const posts: MetadataRoute.Sitemap = allPosts
    .filter((p: any) => p?.slug && p?.status === "publish") // status checked by API but consistent here
    .map((post: any) => ({
      url: normalizeUrl(`${baseUrl}/kennisbank/${post.slug}`),
      lastModified: post?.modified ? new Date(post.modified) : now,
    }));

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