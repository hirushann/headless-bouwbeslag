import { MetadataRoute } from "next";

function normalizeBaseUrl(input: string) {
  return input.replace(/\/+$/, "");
}

function normalizeUrl(url: string) {
  if (url.endsWith("/") && !url.match(/^https?:\/\/[^/]+\/$/)) {
    return url.replace(/\/+$/, "");
  }
  return url;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl");
  const apiUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test") + "/api";
  const now = new Date();

  let products = [], categories = [], brands = [], blogs = [];

  try {
    const res = await fetch(`${apiUrl}/sitemap/urls`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      products = data.products || [];
      categories = data.categories || [];
      brands = data.brands || [];
      blogs = data.blogs || [];
    } else {
      console.error(`Sitemap: Failed to fetch URLs, status ${res.status}`);
    }
  } catch (e: any) {
    console.error("Sitemap: Failed to fetch URLs", e.message);
  }

  const catMap = new Map();
  categories.forEach((cat: any) => catMap.set(cat.id, cat));

  const getCategoryPath = (catId: number): string => {
    let path = "";
    let currentId = catId;
    const visited = new Set();

    while (currentId !== 0 && currentId !== null && catMap.has(currentId) && !visited.has(currentId)) {
      visited.add(currentId);
      const cat = catMap.get(currentId);
      path = path ? `${cat.slug}/${path}` : cat.slug;
      currentId = cat.parent_id;
    }
    return path;
  };

  const categoriesSitemap: MetadataRoute.Sitemap = categories
    .filter((c: any) => c?.slug)
    .map((cat: any) => ({
      url: normalizeUrl(`${baseUrl}/${getCategoryPath(cat.id)}`),
      lastModified: cat?.updated_at ? new Date(cat.updated_at) : now,
    }));

  const productsSitemap: MetadataRoute.Sitemap = products
    .filter((p: any) => p?.slug)
    .map((product: any) => ({
      url: normalizeUrl(`${baseUrl}/${product.slug}`),
      lastModified: product?.updated_at ? new Date(product.updated_at) : now,
    }));

  const postsSitemap: MetadataRoute.Sitemap = blogs
    .filter((p: any) => p?.slug)
    .map((post: any) => ({
      url: normalizeUrl(`${baseUrl}/kennisbank/${post.slug}`),
      lastModified: post?.updated_at ? new Date(post.updated_at) : now,
    }));

  const brandsSitemap: MetadataRoute.Sitemap = brands
    .filter((b: any) => b?.slug)
    .map((brand: any) => ({
      url: normalizeUrl(`${baseUrl}/merken/${brand.slug}`),
      lastModified: brand?.updated_at ? new Date(brand.updated_at) : now,
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
  const combined = [...staticPages, ...categoriesSitemap, ...productsSitemap, ...postsSitemap, ...brandsSitemap];
  const seen = new Set<string>();
  const unique = combined.filter((item) => {
    const key = item.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
}
