import { Metadata } from "next";
import api from "@/lib/woocommerce";
import ProductPageClient from "./ProductPageClient";
import CategoryClient from "../categories/[slug]/CategoryClient";

/* ----------------------------------------------------
 | Types
 ---------------------------------------------------- */
type PageProps = {
  params: Promise<{ slug: string[] }>;
};

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface AttributeTerm {
  id: number;
  name: string;
}

interface Attribute {
  id: number;
  name: string;
  terms: AttributeTerm[];
}

/* ----------------------------------------------------
 | Server-side Fetch Helpers
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

async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const res = await api.get("products/categories", { slug });
    if (!res.data || res.data.length === 0) return null;
    return res.data[0];
  } catch (error) {
    console.error("SSR category fetch failed:", error);
    return null;
  }
}

async function fetchAttributes(): Promise<Attribute[]> {
  try {
    const res = await api.get("products/attributes");
    const attributesData = res.data || [];
    
    // Parallelize fetching terms for all attributes
    const attributesWithTerms = await Promise.all(
      attributesData.map(async (attr: any) => {
        const termsRes = await fetchTermsForAttribute(attr.id);
        return {
          id: attr.id,
          name: attr.name,
          terms: termsRes,
        };
      })
    );

    return attributesWithTerms;
  } catch (error) {
    console.error("Attributes fetch failed:", error);
    return [];
  }
}

async function fetchTermsForAttribute(attributeId: number): Promise<AttributeTerm[]> {
  try {
    const res = await api.get(`products/attributes/${attributeId}/terms`);
    return res.data || [];
  } catch (error) {
    return [];
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
  // Use the last segment of the slug array for lookup
  const currentSlug = slug[slug.length - 1];
  
  // Parallel fetch for metadata optimization
  const [product, category] = await Promise.all([
    getProductBySlug(currentSlug),
    getCategoryBySlug(currentSlug)
  ]);

  // 1. Try Product first
  if (product) {
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

  // 2. Try Category next
  if (category) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    // Reconstruct canonical URL from the slug array
    const canonicalUrl = `${siteUrl}/${slug.join('/')}`;

    const title = `${category.name} | Bouwbeslag`;
    const description =
      category.description
        ?.replace(/<[^>]+>/g, "")
        .slice(0, 160) || "";

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: "website",
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  // 3. Not Found
  return {};
}

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
  // Use the last segment of the slug array for lookup
  const currentSlug = slug[slug.length - 1];
  
  // 1. Check Product & Category in Parallel
  // This drastically reduces load time for category pages, as we don't wait for product fetch to fail.
  const [product, category] = await Promise.all([
    getProductBySlug(currentSlug),
    getCategoryBySlug(currentSlug)
  ]);

  if (product) {
    // Determine tax rate only if product exists
    const taxRate = await getStandardTaxRate();
    const structuredData = generateStructuredData(product, taxRate);

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
        <ProductPageClient product={product} taxRate={taxRate} slug={slug} />
      </>
    );
  }

  // 2. Check Category
  if (category) {
    // Parallelize fetching attributes and subcategories
    const [attributes, subCategoriesRes] = await Promise.all([
        fetchAttributes(),
        api.get("products/categories", { parent: category.id })
    ]);
    
    const subCategories = subCategoriesRes.data || [];

    return (
      <CategoryClient
        category={category}
        attributes={attributes}
        subCategories={subCategories}
        currentSlug={slug}
      />
    );
  }

  // 3. Not Found
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <span>Product of categorie niet gevonden.</span>
    </div>
  );
}