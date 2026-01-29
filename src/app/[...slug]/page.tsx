import React from "react";
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
  acf?: {
    category_meta_title?: string;
    category_meta_description?: string;
  };
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

    // Fetch full product
    const full = await api.get(`products/${res.data[0].id}`);
    const product = full?.data ?? null;
    
    if (!product) return null;

    // Fetch brand logo if product has a brand
    if (product.brands && product.brands.length > 0) {
      const brandId = product.brands[0].id;
      
      try {
        // Fetch brand details from wp/v2/product_brand to get ACF data
        const brandRes = await api.get(`wp/v2/product_brand/${brandId}`);
        const brandData = brandRes.data;
        
        // Check if brand has a logo in ACF
        if (brandData?.acf?.brand_logo) {
          let logoUrl = null;
          const logoData = brandData.acf.brand_logo;
          
          // Handle different logo data formats
          if (typeof logoData === 'number') {
            // Logo is a media ID, fetch the media URL
            try {
              const mediaRes = await api.get(`wp/v2/media/${logoData}`);
              logoUrl = mediaRes.data?.source_url || null;
            } catch (e) {
              console.error("Failed to fetch brand logo media:", e);
            }
          } else if (typeof logoData === 'string') {
            // Logo is already a URL
            logoUrl = logoData;
          } else if (logoData?.url) {
            // Logo is an object with URL
            logoUrl = logoData.url;
          }
          
          // Attach logo URL to the brand data
          if (logoUrl) {
            product.brands[0].logoUrl = logoUrl;
          }
        }
      } catch (e) {
        console.error("Failed to fetch brand data:", e);
        // Continue without brand logo rather than failing the whole request
      }
    }
    
    return product;
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
    
    // Dynamic Product Title
    // Priority: Custom Meta Title -> "Product Name | Bouwbeslag"
    const customTitle = meta.find((m: any) => m.key === "description_meta_title")?.value;
    const metaTitle = customTitle && customTitle.trim() !== "" 
      ? customTitle 
      : `${product.name} | Bouwbeslag`;

    // Dynamic Product Description
    // Priority: Custom Meta Desc -> Short Desc -> Default Template
    const customDesc = meta.find((m: any) => m.key === "description_meta_description")?.value;
    
    let metaDescription = "";
    if (customDesc && customDesc.trim() !== "") {
        metaDescription = customDesc;
    } else if (product.short_description && product.short_description.trim() !== "") {
        metaDescription = product.short_description.replace(/<[^>]+>/g, "").slice(0, 160);
    } else {
        // Ultimate Fallback Template
        const skuText = product.sku ? `(SKU: ${product.sku})` : "";
        metaDescription = `Koop ${product.name} ${skuText} bij Bouwbeslag.nl. ✅ Scherpe prijzen ✅ Snelle levering ✅ 30 dagen bedenktijd.`;
    }

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
      robots: {
        index: true,
        follow: true,
      }
    };
  }

  // 2. Try Category next
  if (category) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    // Reconstruct canonical URL from the slug array
    const canonicalUrl = `${siteUrl}/${slug.join('/')}`;

    // Dynamic Category Title
    // Priority: ACF Meta Title -> "Category Name | Bouwbeslag"
    const acfTitle = category.acf?.category_meta_title;
    const title = acfTitle && acfTitle.trim() !== "" 
        ? acfTitle 
        : `${category.name} | Bouwbeslag`;

    // Dynamic Category Description
    // Priority: ACF Meta Desc -> Description -> Fallback Template
    const acfDesc = category.acf?.category_meta_description;
    let description = "";

    if (acfDesc && acfDesc.trim() !== "") {
        description = acfDesc;
    } else {
        const rawDesc = category.description?.replace(/<[^>]+>/g, "") || "";
        description = rawDesc.length > 50 
            ? rawDesc.slice(0, 160) 
            : `Op zoek naar ${category.name}? Bekijk ons ruime assortiment. ✅ Vóór 16:00 besteld, morgen in huis! Bestel direct online.`;
    }

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
      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Laden...</div>}>
        <CategoryClient
          category={category}
          attributes={attributes}
          subCategories={subCategories}
          currentSlug={slug}
        />
      </React.Suspense>
    );
  }

  // 3. Not Found
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <span>Product of categorie niet gevonden.</span>
    </div>
  );
}