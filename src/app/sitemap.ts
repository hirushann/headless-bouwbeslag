import api from "@/lib/woocommerce";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl";

  const staticPages = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/products`, lastModified: new Date() },
  ];

  const productRes = await api.get("products", {
    per_page: 100,
    status: "publish",
  });

  const products = (Array.isArray(productRes?.data) ? productRes.data : []).map((product: any) => {
    const meta = product.meta_data || [];
    const acfSlug =
      meta.find((m: any) => m.key === "description_slug")?.value ||
      product.slug;

    return {
      url: `${baseUrl}/products/${acfSlug}`,
      lastModified: product.date_modified
        ? new Date(product.date_modified)
        : new Date(),
    };
  });

  const categoryRes = await api.get("products/categories", {
    per_page: 100,
    hide_empty: true,
  });

  const categories = (Array.isArray(categoryRes?.data) ? categoryRes.data : []).map((cat: any) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...categories, ...products];
}