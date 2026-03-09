import React, { cache } from "react";
import { Metadata } from "next";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import api from "@/lib/woocommerce";
import ProductPageClient from "./ProductPageClient";
import CategoryClient from "@/components/CategoryClient";

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
const getProductMetadataCached = cache(async (slug: string) => {
  try {
    const res = await api.get("products", { 
      slug, 
      _fields: "id,name,slug,meta_data,short_description,sku,images",
      next: { revalidate: 3600 }
    });
    if (!Array.isArray(res.data) || !res.data[0]) return null;
    return res.data[0];
  } catch (error) {
    return null;
  }
});

const getCategoryMetadataCached = cache(async (slug: string) => {
  try {
    const res = await api.get("products/categories", { 
      slug, 
      _fields: "id,name,slug,description,acf,parent,image",
      next: { revalidate: 3600 }
    });
    if (!res.data || res.data.length === 0) return null;
    return res.data[0];
  } catch (error) {
    return null;
  }
});

/**
 * Optimization: Fetch all categories once and cache them.
 * This allows synchronous traversal of the category tree.
 */
const getAllCategoriesCached = cache(async () => {
    try {
        const res = await api.get("products/categories", {
            per_page: 100,
            _fields: "id,slug,parent",
            next: { revalidate: 3600 }
        });
        let all = [...(res.data || [])];
        const totalPages = parseInt(res.totalPages || "1");
        if (totalPages > 1) {
            const promises = [];
            for (let i = 2; i <= totalPages; i++) {
                promises.push(api.get("products/categories", {
                    per_page: 100,
                    page: i,
                    _fields: "id,slug,parent",
                    next: { revalidate: 3600 }
                }));
            }
            const results = await Promise.all(promises);
            results.forEach(r => all = [...all, ...(r.data || [])]);
        }
        return all;
    } catch (e) {
        return [];
    }
});

const getProductBySlugCached = cache(async (slug: string) => {
  try {
    // 1. Fetch search by slug - WooCommerce returns the full product here already
    const res = await api.get("products", { slug, next: { revalidate: 3600 } });
    if (!Array.isArray(res.data) || !res.data[0]) return null;
    
    const product = res.data[0];

    // 2. Fetch Brand Logo in parallel if present
    if (product.brands && product.brands.length > 0) {
      const brandId = product.brands[0].id;
      api.get(`wp/v2/product_brand/${brandId}`, { next: { revalidate: 3600 } })
        .then(async (brandRes) => {
          const brandData = brandRes.data;
          if (brandData?.acf?.brand_logo) {
            const logoData = brandData.acf.brand_logo;
            if (typeof logoData === 'number') {
              const mediaRes = await api.get(`wp/v2/media/${logoData}`, { next: { revalidate: 3600 } });
              product.brands[0].logoUrl = mediaRes.data?.source_url || null;
            } else if (typeof logoData === 'string') {
              product.brands[0].logoUrl = logoData;
            } else if (logoData?.url) {
              product.brands[0].logoUrl = logoData.url;
            }
          }
        }).catch(() => {});
    }

    return product;
  } catch (error) {
    return null;
  }
});

const getCategoryBySlugCached = cache(async (slug: string): Promise<Category | null> => {
  try {
    const res = await api.get("products/categories", { 
      slug, 
      next: { revalidate: 3600 }
    });
    if (!res.data || res.data.length === 0) return null;
    return res.data[0];
  } catch (error) {
    return null;
  }
});

const getCategoryByIdCached = cache(async (id: number) => {
  try {
    const res = await api.get(`products/categories/${id}`, { 
      _fields: "id,name,slug,parent" 
    });
    return res.data;
  } catch (error) {
    return null;
  }
});

const getPageMetadata = cache(async (slugArray: string[]) => {
  const currentSlug = decodeURIComponent(slugArray[slugArray.length - 1]);
  const [product, category] = await Promise.all([
    getProductMetadataCached(currentSlug),
    getCategoryMetadataCached(currentSlug)
  ]);
  return { product, category };
});

const getPageData = cache(async (slugArray: string[]) => {
  const currentSlug = decodeURIComponent(slugArray[slugArray.length - 1]);
  const [product, category] = await Promise.all([
    getProductBySlugCached(currentSlug),
    getCategoryBySlugCached(currentSlug)
  ]);
  return { product, category };
});

const fetchTermsForAttribute = cache(async (attributeId: number): Promise<AttributeTerm[]> => {
  try {
    const res = await api.get(`products/attributes/${attributeId}/terms`, {
        per_page: 100,
        _fields: "id,name",
        next: { revalidate: 3600 }
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
        _fields: "id,name",
        next: { revalidate: 86400 } 
    });
    const attributesData = res.data || [];
    
    return await Promise.all(
      attributesData.map(async (attr: any) => {
        const termsRes = await fetchTermsForAttribute(attr.id);
        return {
          id: attr.id,
          name: attr.name,
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
        next: { revalidate: 3600 } // Subcategories don't change that often
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
    const firstPage = await api.get("products", {
      category: categoryId,
      per_page: 100,
      page: 1,
      _fields: "id,attributes,price,name,date_created,total_sales",
      status: 'publish',
      next: { revalidate: 3600 }
    });

    if (!firstPage.data || firstPage.data.length === 0) return [];
    
    let allProducts = [...firstPage.data];
    const totalPagesCount = parseInt(firstPage.totalPages || '1');
    const pagesToFetch = Math.min(totalPagesCount, 10);

    if (pagesToFetch > 1) {
      const pagePromises = [];
      for (let p = 2; p <= pagesToFetch; p++) {
        pagePromises.push(
          api.get("products", {
            category: categoryId,
            per_page: 100,
            page: p,
            _fields: "id,attributes,price,name,date_created,total_sales",
            status: 'publish',
            next: { revalidate: 3600 }
          })
        );
      }
      const results = await Promise.all(pagePromises);
      results.forEach(res => {
        if (res.data) allProducts = [...allProducts, ...res.data];
      });
    }
    return allProducts;
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
  const catMap = new Map(allCategories.map((c: any) => [c.id, c]));
  
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
  { params }: PageProps
): Promise<Metadata> {
  const { slug } = await params;
  
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

    const result = {
      title: metaTitle,
      description: metaDescription,
      alternates: {
        canonical: `/${product.slug}`,
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
      robots: {
        index: true,
        follow: true,
      }
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
    const catImageUrl = category.image?.src || "https://bouwbeslag.nl/logo.webp";

    return {
      title,
      description,
      alternates: {
        canonical: `/${correctPath}`,
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
        description: description,
        images: [catImageUrl], // Corrected to use catImageUrl
      },
      robots: {
        index: true,
        follow: true,
      },
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
    name: product.name,
    image: images,
    description: finalDescription,
    sku: product.sku,
    mpn: product.sku,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      url: `https://bouwbeslag.nl/${product.slug}`,
      currency: currency,
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
    },
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

/* ----------------------------------------------------
 | ✅ PAGE (SERVER COMPONENT)
 ---------------------------------------------------- */
export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { product, category } = await getPageData(slug);

  if (product) {
    const reviewsPromise = getProductReviewsCached(product.id);
    const [taxRate, reviews] = await Promise.all([
      getStandardTaxRate(),
      reviewsPromise
    ]);

    const structuredData = generateStructuredData(product, taxRate, reviews);

    console.log("==========================================");
    console.log("FINAL SCHEMA BEING SENT TO BROWSER:");
    console.log(JSON.stringify(structuredData, null, 2));
    console.log("==========================================");

    // Resolve category image if exists
    await resolveProductImages([product]);

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
        <ProductPageClient product={product} taxRate={taxRate} slug={slug} initialReviews={reviewsPromise} />

      </main>
    );
  }

  // 2. Check Category
  if (category) {
    const sp = await searchParams;
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
      const res = await api.get("products", { 
          per_page: 20, 
          page: initialPage, 
          category: category.id,
          status: 'publish',
          ...sortParams,
          next: { revalidate: 60 }
      });
      const prods = await resolveProductImages(res.data || []);
      return {
        prods,
        totalPages: parseInt(res.totalPages || '1'),
        total: parseInt(res.total || '0')
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
    
    // Pass promises for heavy sidebar/filter data
    const initialFilterBaseProducts = filterBasePromise; 
    const initialProducts = currentPageData.prods;
    const initialTotalPages = currentPageData.totalPages;
    const initialTotalProducts = currentPageData.total;


    const currentPath = slug.join("/");
    if (currentPath !== correctPath) {
      const query = sp ? new URLSearchParams(sp as any).toString() : "";
      const destination = `/${correctPath}${query ? `?${query}` : ""}`;
      permanentRedirect(destination);
    }

    return (
      <main>
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Laden...</div>}>
          <CategoryClient
            key={category.id}
            category={category}
            attributes={attributesPromise}
            subCategories={subCategoriesPromise}
            currentSlug={slug}
            initialProducts={initialProducts}
            initialTotalPages={initialTotalPages}
            initialTotalProducts={initialTotalProducts}
            initialFilterBaseProducts={filterBasePromise}

          />
        </React.Suspense>

      </main>
    );
  }

  // 3. Not Found
  notFound();
}
