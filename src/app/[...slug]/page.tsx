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
      _fields: "id,name,slug,meta_data,short_description,sku,images"
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
      _fields: "id,name,slug,description,acf,parent,image"
    });
    if (!res.data || res.data.length === 0) return null;
    return res.data[0];
  } catch (error) {
    return null;
  }
});

const getProductBySlugCached = cache(async (slug: string) => {
  try {
    const res = await api.get("products", { slug, next: { revalidate: 3600 } });
    if (!Array.isArray(res.data) || !res.data[0]) return null;

    const full = await api.get(`products/${res.data[0].id}`, { next: { revalidate: 3600 } });
    const product = full?.data ?? null;
    if (!product) return null;

    // Fetch Brand Logo if present
    if (product.brands && product.brands.length > 0) {
      const brandId = product.brands[0].id;
      try {
        const brandRes = await api.get(`wp/v2/product_brand/${brandId}`);
        const brandData = brandRes.data;
        
        if (brandData?.acf?.brand_logo) {
          let logoUrl = null;
          const logoData = brandData.acf.brand_logo;
          
          if (typeof logoData === 'number') {
            try {
              const mediaRes = await api.get(`wp/v2/media/${logoData}`);
              logoUrl = mediaRes.data?.source_url || null;
            } catch (e) {}
          } else if (typeof logoData === 'string') {
            logoUrl = logoData;
          } else if (logoData?.url) {
            logoUrl = logoData.url;
          }
          if (logoUrl) product.brands[0].logoUrl = logoUrl;
        }
      } catch (e) {}
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
  const product = await getProductMetadataCached(currentSlug);
  if (product) return { product, category: null };
  const category = await getCategoryMetadataCached(currentSlug);
  return { product: null, category };
});

const getPageData = cache(async (slugArray: string[]) => {
  const currentSlug = decodeURIComponent(slugArray[slugArray.length - 1]);

  const product = await getProductBySlugCached(currentSlug);
  if (product) return { product, category: null };

  const category = await getCategoryBySlugCached(currentSlug);
  return { product: null, category };
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
        _fields: "id,name",
        next: { revalidate: 3600 } 
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


async function getStandardTaxRate(): Promise<number> {
  try {
    const res = await api.get("taxes");
    const rates = res.data;
    // Look for "standard" class (often empty string or 'standard')
    // We'll take the first one or default to 21
    const standard = rates.find((r: any) => r.class === "standard" || r.class === "");
    return standard && standard.rate ? parseFloat(standard.rate) : 21;
  } catch (error) {
    // console.error("Tax fetch failed, defaulting to 21:", error);
    return 21;
  }
}

/* ----------------------------------------------------
 | Helper Functions
 ---------------------------------------------------- */
const clean = (s: string | undefined) => s ? s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() : "";

async function traverseCategoryPath(category: any): Promise<string> {
  const path = [category.slug];
  let currentParentId = category.parent;
  let depth = 0;
  
  while (currentParentId && currentParentId !== 0 && depth < 10) {
    const parent = await getCategoryByIdCached(currentParentId);
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
function generateStructuredData(product: any, taxRate: number) {
  if (!product) return null;

  // Price Calculation Logic
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
export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { product, category } = await getPageData(slug);

  if (product) {
    const taxRate = await getStandardTaxRate();
    const structuredData = generateStructuredData(product, taxRate);

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
        <ProductPageClient product={product} taxRate={taxRate} slug={slug} />
      </main>
    );
  }

  // 2. Check Category
  if (category) {
    console.log("Category Info Header/Server Side:", category);
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


    const [attributes, subCategories, productsRes] = await Promise.all([
        fetchAttributes(),
        fetchAllSubCategoriesCached(category.id),
        api.get("products", { 
            per_page: 20, 
            page: initialPage, 
            category: category.id,
            status: 'publish',
            ...sortParams,
            next: { revalidate: 60 }
        })
    ]);
    
    const initialFilterBaseProducts: any[] = [];
    const initialProducts = await resolveProductImages(productsRes.data || []);
    const initialTotalPages = parseInt(productsRes.totalPages || '1');
    const initialTotalProducts = parseInt(productsRes.total || '0');

    const correctPath = await traverseCategoryPath(category);
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
            attributes={attributes}
            subCategories={subCategories}
            currentSlug={slug}
            initialProducts={initialProducts}
            initialTotalPages={initialTotalPages}
            initialTotalProducts={initialTotalProducts}
            initialFilterBaseProducts={initialFilterBaseProducts}
          />
        </React.Suspense>
      </main>
    );
  }

  // 3. Not Found
  notFound();
}
