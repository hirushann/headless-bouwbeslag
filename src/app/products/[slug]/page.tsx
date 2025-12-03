import { Metadata } from "next";
import api from "@/lib/woocommerce";
import ProductPageClient from "./ProductPageClient";

/* ----------------------------------------------------
 | Types
 ---------------------------------------------------- */
type PageProps = {
  params: Promise<{ slug: string }>;
};

/* ----------------------------------------------------
 | Server-side product fetch
 | (Used by both page & metadata)
 ---------------------------------------------------- */
async function getProductBySlug(slug: string) {
  try {
    const res = await api.get("products", { slug });

    if (!Array.isArray(res.data) || !res.data[0]) {
      return null;
    }

    // Fetch full product (you already do this client-side)
    const full = await api.get(`products/${res.data[0].id}`);
    return full?.data ?? null;
  } catch (error) {
    console.error("SSR product fetch failed:", error);
    return null;
  }
}

/* ----------------------------------------------------
 | ✅ SEO METADATA (ACF-powered)
 ---------------------------------------------------- */
export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const meta = product.meta_data || [];

  const metaTitle =
    meta.find((m: any) => m.key === "description_meta_title")?.value ||
    product.name;

  const metaDescription =
    meta.find((m: any) => m.key === "description_meta_description")?.value ||
    product.short_description ||
    "";

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
    },
  };
}

/* ----------------------------------------------------
 | ✅ PAGE (SERVER COMPONENT)
 ---------------------------------------------------- */
export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <span>Product niet gevonden.</span>
      </div>
    );
  }

  /**
   * Pass FULL product to client component.
   * Nothing else renders here.
   */
  return <ProductPageClient product={product} />;
}