import React, { cache } from "react";
import { Metadata } from "next";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import api from "@/lib/woocommerce";
import ProductPageClient from "./ProductPageClient";
import CategoryClient from "@/components/CategoryClient";
import { extractRelatedIdentifiers } from "@/lib/productUtils";
import { fetchRelatedProductsBatchAction, resolveSlugAction } from "@/app/actions";

/* ----------------------------------------------------
 | Types
 ---------------------------------------------------- */
type PageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
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
 | Server-side Fetch Helpers (Deduplicated with cache)
 ---------------------------------------------------- */

/**
 * Optimization: Fetch all categories once and cache them.
 * This allows synchronous traversal of the category tree.
 */
import { fetchCategories } from "@/lib/woocommerce";
import { fetchProductBySlug, fetchMeiliProducts, mapMeiliToWooProduct } from "@/lib/meilisearch-products";

const getAllCategoriesCached = cache(async () => {
    return await fetchCategories();
});

const getProductBySlugCached = cache(async (slug: string) => {
    return await fetchProductBySlug(slug);
});

const getCategoryBySlugCached = cache(async (slug: string): Promise<Category | null> => {
    const categories = await getAllCategoriesCached();
    return categories.find((c: any) => c.slug.toLowerCase() === slug.toLowerCase()) || null;
});


const getPageMetadata = cache(async (slugArray: string[]) => {
  const currentSlug = decodeURIComponent(slugArray[slugArray.length - 1]);
  
  // 1. Check if it's a product in Meilisearch
  const product = await getProductBySlugCached(currentSlug);
  if (product) {
      return { product, category: null };
  }

  // 2. Check if it's a category in Empire
  const category = await getCategoryBySlugCached(currentSlug);
  if (category) {
      return { product: null, category };
  }

  return { product: null, category: null };
});

const getPageData = cache(async (slugArray: string[]) => {
  const currentSlug = decodeURIComponent(slugArray[slugArray.length - 1]);
  
  // 1. Check if it's a product in Meilisearch
  const product = await getProductBySlugCached(currentSlug);
  if (product) {
      return { product, category: null };
  }

  // 2. Check if it's a category in Empire
  const category = await getCategoryBySlugCached(currentSlug);
  if (category) {
      return { product: null, category };
  }

  return { product: null, category: null };
});

const fetchTermsForAttribute = cache(async (attributeId: number): Promise<AttributeTerm[]> => {
  try {
    const res = await api.get(`products/attributes/${attributeId}/terms`, {
        per_page: 100,
        _fields: "id,name",
        cache: 'no-store' // Always fresh — attribute terms must update instantly
    });
    return res.data || [];
  } catch (error) {
    return [];
  }
});

const fetchAttributes = cache(async (): Promise<Attribute[]> => {
  try {
    const res = await api.get("products/attributes", { 
        per_page: 100,
        _fields: "id,name,slug",
        cache: 'no-store' // Always fresh — attribute list must update instantly
    });
    const attributesData = res.data || [];
    
    return await Promise.all(
      attributesData.map(async (attr: any) => {
        const termsRes = await fetchTermsForAttribute(attr.id);
        return {
          id: attr.id,
          name: attr.name,
          slug: attr.slug,
          terms: termsRes,
        };
      })
    );
  } catch (error) {
    return [];
  }
});

const fetchAllSubCategoriesCached = cache(async (parentId: number) => {
  let allSubs: any[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const res = await api.get("products/categories", { 
        parent: parentId, 
        per_page: 100, 
        page, 
        hide_empty: false,
        _fields: "id,name,slug,parent,count",
        next: { revalidate: 1 }
    });
    if (!res.data || res.data.length === 0) break;
    allSubs = [...allSubs, ...res.data];
    totalPages = parseInt(res.totalPages || '1');
    page++;
  } while (page <= totalPages);
  
  return allSubs;
});

const fetchAllCategoryProductsForFiltersCached = cache(async (categoryId: number) => {
  try {
    const filters = [`category_id = ${categoryId}`];
    const { products } = await fetchMeiliProducts(1000, 0, "", filters);
    
    // The products from Meilisearch need to be somewhat compatible with what CategoryClient expects.
    // CategoryClient expects products to have attributes mapped properly.
    // fetchMeiliProducts returns the Meilisearch format which CategoryClient is already processing in the main list.
    // However, CategoryClient parses `allCategoryProductsForFilters` looking for `attributes` array (WooCommerce style).
    // Let's map Meilisearch products to have an `attributes` array so `CategoryClient` filter extraction still works!
    
    return products.map((p: any) => {
      // Map Meilisearch flat attributes back to WooCommerce-like attributes for filter extraction
      const wooAttributes: any[] = [];
      
      const tryAddAttr = (key: string, name: string, isTerms: boolean = false) => {
        if (p[key]) {
          wooAttributes.push({
            name,
            options: Array.isArray(p[key]) ? p[key] : [p[key]]
          });
        }
      };

      tryAddAttr('color', 'Kleur');
      tryAddAttr('material', 'Materiaal');
      tryAddAttr('finish', 'Finish');
      tryAddAttr('brand_name', 'Merk');

      // We don't have all attributes in Meilisearch currently as an object, but we have some direct fields.
      // CategoryClient handles some flat fields directly (like color, finish, material).
      // We pass the raw Meilisearch product and CategoryClient might just need a few tweaks if it relies on `attributes` array.
      
      return {
        ...p,
        attributes: wooAttributes,
        brands: p.brand_name ? [{ name: p.brand_name }] : [],
        price: p.price_amount?.toString(),
        stock_status: p.stock_status,
      };
    });
  } catch (error) {
    return [];
  }
});

const getProductReviewsCached = cache(async (productId: number) => {
  try {
    const res = await api.get("products/reviews", { 
      product: productId, 
      status: 'approved',
      per_page: 50,
      next: { revalidate: 3600 }
    });
    return res.data || [];
  } catch (error) {
    return [];
  }
});


const getGlobalRatingCached = cache(async () => {
  try {
    const id = "11199";
    const code = "57112442ebe476.33241772";
    const url = `https://dashboard.webwinkelkeur.nl/api/1.0/ratings_summary.json?id=${id}&code=${code}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === "success" && data.data?.ratings_summary) {
        return {
            average: parseFloat(data.data.ratings_summary.rating),
            count: parseInt(data.data.ratings_summary.total_ratings)
        };
    }
    return null;
  } catch (error) {
    return null;
  }
});


const getStandardTaxRate = cache(async (): Promise<number> => {
  try {
    const res = await api.get("taxes", { next: { revalidate: 86400 } });
    const rates = res.data;
    const standard = rates.find((r: any) => r.class === "standard" || r.class === "");
    return standard && standard.rate ? parseFloat(standard.rate) : 21;
  } catch (error) {
    return 21;
  }
});

/* ----------------------------------------------------
 | Helper Functions
 ---------------------------------------------------- */
const clean = (s: string | undefined) => s ? s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";

async function traverseCategoryPath(category: any): Promise<string> {
  const allCategories = await getAllCategoriesCached();
  const catMap = new Map<number, any>(allCategories.map((c: any) => [c.id, c]));
  
  const path = [category.slug];
  let currentParentId = category.parent;
  let depth = 0;
  
  while (currentParentId && currentParentId !== 0 && depth < 10) {
    const parent = catMap.get(currentParentId);
    if (!parent) break;
    path.unshift(parent.slug);
    currentParentId = parent.parent;
    depth++;
  }
  return path.join('/');
}

async function resolveProductImages(products: any[]) {
    if (!products || products.length === 0) return products;

    const mediaIds = new Set<string>();
    products.forEach((p: any) => {
        const catImgId = p.meta_data?.find((m: any) => m.key === "assets_cat_image")?.value ||
                         p.meta_data?.find((m: any) => m.key === "cat_image")?.value;
        if (catImgId && /^\d+$/.test(String(catImgId))) {
            mediaIds.add(String(catImgId));
        }
    });

    if (mediaIds.size > 0) {
        try {
            const mediaRes = await api.get('wp/v2/media', { 
                include: Array.from(mediaIds).join(','),
                per_page: 100,
                _fields: 'id,source_url'
            });

            if (Array.isArray(mediaRes.data)) {
                const mediaMap = new Map();
                mediaRes.data.forEach((m: any) => mediaMap.set(String(m.id), m.source_url));

                products.forEach((p: any) => {
                    const catImgId = p.meta_data?.find((m: any) => m.key === "assets_cat_image")?.value ||
                                     p.meta_data?.find((m: any) => m.key === "cat_image")?.value;
                    if (catImgId && mediaMap.has(String(catImgId))) {
                        p.resolved_cat_image = mediaMap.get(String(catImgId));
                    }
                });
            }
        } catch (error) {
            // Silently fail and fallback to client-side or original images
        }
    }
    return products;
}

/* ----------------------------------------------------
 | ✅ SEO METADATA (ACF-powered)
 ---------------------------------------------------- */
export async function generateMetadata(
  { params, searchParams }: PageProps
): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  
  // If there are any query parameters (like ?filter_something=, ?sort=, ?page=), do not index or follow
  const hasQueryParams = sp && Object.keys(sp).length > 0;
  
  const { product, category } = await getPageMetadata(slug);

  if (product) {
    const meta = product.meta_data || [];
    const acfTitle = meta.find((m: any) => m.key === "description_meta_title")?.value;
    const metaTitle = clean(acfTitle) || `${clean(product.name)} | Bouwbeslag`;
    const acfDesc = meta.find((m: any) => m.key === "description_meta_description")?.value;
    
    let metaDescription = clean(acfDesc);
    if (!metaDescription) {
      if (product.short_description) {
        metaDescription = clean(product.short_description).slice(0, 160);
      } else {
        const skuText = product.sku ? `(SKU: ${product.sku})` : "";
        metaDescription = `Koop ${clean(product.name)} ${skuText} bij Bouwbeslag.nl. ✅ Scherpe prijzen ✅ Snelle levering ✅ 30 dagen bedenktijd.`;
      }
    }

    const imageUrl = product.images?.[0]?.src || "https://bouwbeslag.nl/ogimg-new.png";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl";
    const result = {
      title: metaTitle,
      description: metaDescription,
      alternates: {
        canonical: `${siteUrl}/${product.slug}`,
      },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        url: `/${product.slug}`,
        type: "website",
        images: [
          {
            url: imageUrl,
            alt: metaTitle,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: metaTitle,
        description: metaDescription,
        images: [imageUrl],
      },
      robots: hasQueryParams ? { index: false, follow: false } : { index: true, follow: true }
    };
    return result;
  }

  // 2. Try Category next
  if (category) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl";
    const canonicalPath = slug.map(s => encodeURIComponent(s)).join('/');
    
    // Dynamic Category Title
    const acfTitle = category.acf?.category_meta_title;
    let title = clean(acfTitle) || `${clean(category.name)} | Bouwbeslag`;

    // Dynamic Category Description
    const acfDesc = category.acf?.category_meta_description;
    let description = clean(acfDesc);

    if (!description) {
        const rawDesc = clean(category.description);
        description = rawDesc.length > 50 
            ? rawDesc.slice(0, 160) 
            : `Op zoek naar ${clean(category.name)}? Bekijk ons ruime assortiment. ✅ Vóór 16:00 besteld, morgen in huis! Bestel direct online.`;
    }

    const correctPath = await traverseCategoryPath(category);
    const catImageUrl = (category as any).image?.src || "https://bouwbeslag.nl/logo.webp";

    return {
      title,
      description,
      alternates: {
        canonical: `${siteUrl}/${correctPath}`,
      },
      openGraph: {
        title,
        description,
        url: `/${correctPath}`,
        type: "website",
        images: [
          {
            url: catImageUrl,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: String(category.description || ""),
      },
      robots: hasQueryParams ? { index: false, follow: false } : { index: true, follow: true }
    };
  }

  return {};
}

/* ----------------------------------------------------
 | ✅ STRUCTURED DATA (JSON-LD)
 ---------------------------------------------------- */
function generateStructuredData(product: any, taxRate: number, reviews: any[] = []) {
  if (!product) return null;

  const meta = product.meta_data || [];

  // Price Calculation Logic
  let salePrice = product.price ? parseFloat(product.price) : 0;
  const b2cPrice = meta.find((m: any) => m.key === "crucial_data_b2b_and_b2c_sales_price_b2c")?.value;
  if (b2cPrice && !isNaN(parseFloat(b2cPrice))) {
      salePrice = parseFloat(b2cPrice);
  }

  const taxMultiplier = 1 + (taxRate / 100);
  const priceWithVat = salePrice * taxMultiplier;
  
  const currency = "EUR"; 
  
  const acfDesc = meta.find((m: any) => m.key === "description_meta_description")?.value;
  const description = clean(acfDesc) || clean(product.short_description) || clean(product.description) || "";
  
  const images = product.images?.map((img: any) => img.src) || [];

  const availability =
    product.stock_status === "instock"
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const productBrand = product.brands?.[0]?.name;
  const productBrandSlug = product.brands?.[0]?.slug;
  const brandFromMeta = meta.find((m: any) => m.key === "brand" || m.key === "description_bouwbeslag_brand" || m.key === "merk")?.value;
                        
  const brandName = productBrand || brandFromMeta || productBrandSlug || "Bouwbeslag";

  // EAN / GTIN Logic
  const eanCode = meta.find((m: any) => m.key === "crucial_data_product_ean_code")?.value || 
                  meta.find((m: any) => m.key === "crucial_data_product_bol_ean_code")?.value ||
                  meta.find((m: any) => m.key === "_ean")?.value ||
                  meta.find((m: any) => m.key === "_barcode")?.value;

  const finalDescription = description || `Koop ${product.name} bij Bouwbeslag.nl. ✅ Scherpe prijzen ✅ Snelle levering ✅ 30 dagen bedenktijd.`;

  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "@id": `https://bouwbeslag.nl/${product.slug}#product`,
    url: `https://bouwbeslag.nl/${product.slug}`,
    name: product.name,
    image: images,
    description: finalDescription,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
  };

  if (product.categories && product.categories.length > 0) {
    schema.category = product.categories.map((c: any) => c.name).join(' > ');
  }

  if (product.weight) {
    schema.weight = {
      "@type": "QuantitativeValue",
      "value": product.weight,
      "unitCode": "KGM"
    };
  }

  const attributes = product.attributes || [];
  const colorAttr = attributes.find((a: any) => a.name && (a.name.toLowerCase().includes('kleur') || a.name.toLowerCase().includes('color')));
  if (colorAttr && colorAttr.options && colorAttr.options.length > 0) {
    schema.color = colorAttr.options.join(' / ');
  }

  const materialAttr = attributes.find((a: any) => a.name && (a.name.toLowerCase().includes('materiaal') || a.name.toLowerCase().includes('material')));
  if (materialAttr && materialAttr.options && materialAttr.options.length > 0) {
    schema.material = materialAttr.options.join(' / ');
  }

  const sizeAttr = attributes.find((a: any) => a.name && (a.name.toLowerCase().includes('maat') || a.name.toLowerCase().includes('afmeting') || a.name.toLowerCase().includes('size')));
  if (sizeAttr && sizeAttr.options && sizeAttr.options.length > 0) {
    schema.size = sizeAttr.options.join(' / ');
  }

  schema.offers = {
      "@type": "Offer",
      url: `https://bouwbeslag.nl/${product.slug}`,
      priceCurrency: currency,
      price: priceWithVat.toFixed(2),
      priceValidUntil: "2027-12-31", 
      itemCondition: "https://schema.org/NewCondition",
      availability: availability,
      seller: {
        "@type": "Organization",
        name: "Bouwbeslag",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: priceWithVat > 50 ? "0" : "6.95", 
          currency: currency
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "NL"
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: "0",
            maxValue: "1",
            unitCode: "d"
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: "1",
            maxValue: "2",
            unitCode: "d"
          }
        }
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "NL",
        returnPolicyCategory: "http://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: "30",
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn"
      }
    };

  if (eanCode) {
    const eanStr = String(eanCode).trim();
    if (eanStr.length === 8) {
      schema.gtin8 = eanStr;
    } else if (eanStr.length === 12) {
      schema.gtin12 = eanStr;
    } else if (eanStr.length === 13 || eanStr.length === 14) {
      schema.gtin13 = eanStr;
    } else if (eanStr.length > 0) {
      schema.gtin = eanStr; 
    }
  }

  // Pure WooCommerce Aggregate Rating Logic
  let ratingCount = parseInt(product.rating_count || "0");
  let averageRating = parseFloat(product.average_rating || "0");

  // If WooCommerce summary totals are 0, dynamically calculate from individual reviews
  if (ratingCount === 0 && reviews && reviews.length > 0) {
    ratingCount = reviews.length;
    const total = reviews.reduce((acc, r: any) => acc + (parseInt(r.rating) || 0), 0);
    averageRating = parseFloat((total / ratingCount).toFixed(1));
  }

  if (ratingCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: averageRating,
      reviewCount: ratingCount,
      bestRating: 5, 
      worstRating: 1
    };
  }

  // Individual Reviews
  if (reviews && reviews.length > 0) {
    schema.review = reviews.slice(0, 5).map((r: any) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating.toString(),
        bestRating: "5",
        worstRating: "1"
      },
      author: {
        "@type": "Person",
        name: r.reviewer || "Klant",
      },
      reviewBody: clean(r.review),
      datePublished: r.date_created.split('T')[0],
    }));
  }

  return schema;
}

async function CategoryLoader({ category, slug, sp }: { category: any, slug: string[], sp: any }) {
    const initialPage = parseInt((sp?.page as string) || "1");
    const sort = (sp?.sort as string) || "";
    const sortParams: any = {};
    if (sort === "price-low-high") {
        sortParams.orderby = "price";
        sortParams.order = "asc";
    } else if (sort === "price-high-low") {
        sortParams.orderby = "price";
        sortParams.order = "desc";
    } else if (sort === "date") {
        sortParams.orderby = "date";
        sortParams.order = "desc";
    } else if (sort === "title-asc") {
        sortParams.orderby = "title";
        sortParams.order = "asc";
    } else if (sort === "title-desc") {
        sortParams.orderby = "title";
        sortParams.order = "desc";
    } else if (sort) {
        sortParams.orderby = sort;
    }

    const fetchCurrentPage = async () => {
      const limit = 20;
      const offset = (initialPage - 1) * limit;
      
      // Filter by category slug — matches the Empire category slug stored in Meilisearch
      // (WooCommerce category IDs ≠ Empire category IDs stored in Meilisearch)
      const categorySlug = category.slug;
      const filters = [`category_slug = ${categorySlug}`];

      // Handle sortParams for Meilisearch if necessary
      // Note: Meilisearch sorting must be configured in settings.
      // E.g. sort: ['price:asc'] if `sortParams.orderby === "price"`
      // For now we'll stick to default sorting and just filter by category.
      
      const { products: prods, total } = await fetchMeiliProducts(limit, offset, "", filters);
      
      return {
        prods: prods.map(mapMeiliToWooProduct),
        totalPages: Math.ceil(total / limit) || 1,
        total: total
      };
    };
    
    // Start all requests in parallel
    const attributesPromise = fetchAttributes();
    const subCategoriesPromise = fetchAllSubCategoriesCached(category.id);
    const filterBasePromise = fetchAllCategoryProductsForFiltersCached(category.id);
    const pathPromise = traverseCategoryPath(category);
    const currentPagePromise = fetchCurrentPage();

    // Await ONLY what's needed for initial products and SEO redirect check
    const [currentPageData, correctPath] = await Promise.all([
        currentPagePromise,
        pathPromise
    ]);

    return (
        <CategoryClient
          key={category.id}
          category={category}
          subCategories={subCategoriesPromise}
          currentSlug={slug}
          initialProducts={currentPageData.prods}
          initialTotalPages={currentPageData.totalPages}
          initialTotalProducts={currentPageData.total}
        />
    );
}

/* ----------------------------------------------------
 | ✅ PAGE (SERVER COMPONENT)
 ---------------------------------------------------- */
export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { product, category } = await getPageData(slug);

  if (product) {
    const sp = await searchParams;
    const currentPath = slug.join("/");
    // Product should permanently be located at /product-slug (root level)
    if (currentPath !== product.slug) {
      const query = sp && Object.keys(sp).length > 0 ? new URLSearchParams(sp as any).toString() : "";
      permanentRedirect(`/${product.slug}${query ? `?${query}` : ""}`);
    }

    // 1. Kick off parallel background promises (DO NOT AWAIT)
    const reviewsPromise = getProductReviewsCached(product.id);
    const taxRatePromise = getStandardTaxRate();
    const resolvedProductPromise = resolveProductImages([product]).then(p => p[0]);
    
    // We only await the most critical pieces if absolutely necessary, 
    // but here we can actually trust the product we already have.
    
    // For SEO structured data, we'll use defaults and not block the page.
    // If we MUST have the exact tax rate for SEO, we can use a hardcoded 21 which is standard for this shop.
    const structuredData = generateStructuredData(product, 21, []); 

    // Related items fetch (No block)
    const relatedIds = extractRelatedIdentifiers(product);
    const relatedItemsPromise = fetchRelatedProductsBatchAction(relatedIds, product.id);

    return (
      <main>
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
            }}
          />
        )}
        <ProductPageClient 
            key={product.id}
            product={product} 
            taxRate={21} // Fallback to 21 initially
            slug={slug} 
            initialReviews={reviewsPromise} 
            initialRelatedItems={relatedItemsPromise}
            resolvedProductPromise={resolvedProductPromise}
        />
      </main>
    );
  }

  // 2. Check Category
  if (category) {
    const sp = await searchParams;
    
    // SEO Redirect Check - Top level to avoid Suspense rendering `<meta http-equiv="refresh">`
    const correctPath = await traverseCategoryPath(category);
    const currentPath = slug.join("/");
    
    if (currentPath !== correctPath) {
      const query = sp && Object.keys(sp).length > 0 ? new URLSearchParams(sp as any).toString() : "";
      permanentRedirect(`/${correctPath}${query ? `?${query}` : ""}`);
    }

    return (
      <main className="min-h-screen bg-[#F7F7F7]">
        <CategoryLoader category={category} slug={slug} sp={sp} />
      </main>
    );
  }

  // 3. Not Found
  notFound();
}
