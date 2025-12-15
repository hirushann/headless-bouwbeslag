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
  }
}

async function getStandardTaxRate(): Promise<number> {
  try {
    const res = await api.get("taxes");
    const rates = res.data;
    // Look for "standard" class (often empty string or 'standard')
    // We'll take the first one or default to 21
    const standard = rates.find((r: any) => r.class === "standard" || r.class === "");
    return standard && standard.rate ? parseFloat(standard.rate) : 21;
  } catch (error) {
    console.error("Tax fetch failed, defaulting to 21:", error);
    return 21;
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
      canonical: `/${product.slug}`,
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
/* ----------------------------------------------------
 | ✅ STRUCTURED DATA (JSON-LD)
 ---------------------------------------------------- */
function generateStructuredData(product: any, taxRate: number) {
  if (!product) return null;

  // Helper to safely get meta data
  const getMeta = (key: string) =>
    product.meta_data?.find((m: any) => m.key === key)?.value;

  // Price Calculation Logic
  // We assume product.price is the definitive selling price (likely includes tax if B2C options are standard).
  // Schema.org expects dot decimal.
  let price = product.price ? parseFloat(product.price) : 0;
  
  const currency = "EUR"; 
  const description =
    product.short_description?.replace(/<[^>]+>/g, "") ||
    product.description?.replace(/<[^>]+>/g, "") ||
    "";
  
  const images = product.images?.map((img: any) => img.src) || [];

  const availability =
    product.stock_status === "instock"
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description: description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brands?.[0]?.name || "Bouwbeslag",
    },
    offers: {
      "@type": "Offer",
      url: `https://bouwbeslag.nl/${product.slug}`,
      priceCurrency: currency,
      price: price.toFixed(2),
      priceValidUntil: "2025-12-31", 
      itemCondition: "https://schema.org/NewCondition",
      availability: availability,
      seller: {
        "@type": "Organization",
        name: "Bouwbeslag",
      },
    },
  };

  return schema;
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

  const taxRate = await getStandardTaxRate();
  const structuredData = generateStructuredData(product, taxRate);

  /**
   * Pass FULL product and taxRate to client component.
   * Nothing else renders here.
   */
  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
      <ProductPageClient product={product} taxRate={taxRate} />
    </>
  );
}