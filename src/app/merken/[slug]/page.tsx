import api, { getBrand } from "@/lib/woocommerce";
import { searchProducts } from "@/actions/search";
import { fetchMeiliProducts, mapMeiliToWooProduct } from "@/lib/meilisearch-products";
import CategoryClient from "@/components/CategoryClient";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShopProductCard from "@/components/ShopProductCard";
import Image from "next/image";
import { Metadata } from 'next';


interface AttributeTerm { id: number; name: string; }
interface Attribute { id: number; name: string; slug: string; terms: AttributeTerm[]; }

const fetchTermsForAttribute = cache(async (attributeId: number): Promise<AttributeTerm[]> => {
  try {
    const res = await api.get(`products/attributes/${attributeId}/terms`, { per_page: 100, _fields: "id,name", cache: 'no-store' });
    return res.data || [];
  } catch (error) { return []; }
});

const fetchAttributes = cache(async (): Promise<Attribute[]> => {
  try {
    const res = await api.get("products/attributes", { per_page: 100, _fields: "id,name,slug", cache: 'no-store' });
    const attributesData = res.data || [];
    return await Promise.all(
      attributesData.map(async (attr: any) => {
        const termsRes = await fetchTermsForAttribute(attr.id);
        return { id: attr.id, name: attr.name, slug: attr.slug, terms: termsRes };
      })
    );
  } catch (error) { return []; }
});

export const dynamic = 'force-dynamic';



export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ category?: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const { category: categorySlug } = await searchParams;
    const brand = await getBrand(slug);

    if (!brand) {
        return {};
    }

    // Dynamic Title
    // Priority: Category Filter -> ACF Title -> "Brand Name | Bouwbeslag"
    let title = brand.acf?.brand_meta_title && brand.acf.brand_meta_title.trim() !== "" 
        ? brand.acf.brand_meta_title 
        : `${brand.name} | Bouwbeslag`;
    
    // Fetch Category Name if filtered to create unique title
    if (categorySlug) {
        try {
            const { data: categories } = await api.get("products/categories", { slug: categorySlug });
            if (categories && categories.length > 0) {
                 const categoryName = categories[0].name;
                 title = `${brand.name} ${categoryName} | Bouwbeslag`;
            }
        } catch (e) {
            console.error("Error fetching category for metadata:", e);
        }
    }

    // Dynamic Description
    // Priority: ACF Desc -> Brand Desc -> Fallback Template
    const acfDesc = brand.acf?.brand_meta_description;
    let description = "";

    if (acfDesc && acfDesc.trim() !== "") {
        description = acfDesc;
    } else if (brand.description && brand.description.trim() !== "") {
        description = brand.description.replace(/<[^>]+>/g, "").slice(0, 160);
    } else {
        description = `Bekijk het complete assortiment van ${brand.name} bij Bouwbeslag. ✅ Scherpe prijzen ✅ Snelle levering ✅ Deskundig advies.`;
    }

    // Append category to description if filtered
    if (categorySlug) {
        try {
            const { data: categories } = await api.get("products/categories", { slug: categorySlug });
            if (categories && categories.length > 0) {
                 const categoryName = categories[0].name;
                 description = `Bekijk ons assortiment ${categoryName} van ${brand.name}. ${description}`; 
                 // Ensure description isn't too long (google truncates ~160 chars, but better unique than short duplicate)
                 if (description.length > 300) description = description.substring(0, 297) + "...";
            }
        } catch (e) {
            // ignore
        }
    }

    // Construct Canonical URL (Self-referencing for filtered pages)
    const canonicalPath = categorySlug 
        ? `/merken/${slug}?category=${categorySlug}`
        : `/merken/${slug}`;

    return {
        title: title,
        description: description,
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title: title,
            description: description,
            url: canonicalPath,
        },
        robots: categorySlug ? { index: false, follow: false } : { index: true, follow: true }
    };
}

export default async function BrandPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ category?: string }> }) {
    const { slug } = await params;
    const { category: categorySlug } = await searchParams;
    const brand = await getBrand(slug);

    // console.log("Brand Data Response:", JSON.stringify(brand, null, 2));

    if (!brand) {
        notFound();
    }

    const allAttributes = await fetchAttributes();

    
  const customHero = (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/4 max-w-[200px] aspect-square flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 p-4 relative">
                 {brand.acf?.brand_logo ? (
                     <Image 
                        src={typeof brand.acf.brand_logo === 'string' ? brand.acf.brand_logo : (brand.acf.brand_logo as any).url} 
                        alt={brand.name} 
                        fill
                        sizes="(max-width: 768px) 100vw, 200px"
                        className="object-contain p-4"
                    />
                ) : (
                    <span className="text-3xl font-bold text-gray-300">{brand.name}</span>
                )}
            </div>
            <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4 text-gray-900">{brand.name}</h1>
                <div 
                    className="prose prose-sm max-w-none text-gray-600"
                    dangerouslySetInnerHTML={{ 
                        __html: ((brand.description && brand.description.trim() !== "") 
                            ? brand.description 
                            : (brand.acf?.brand_description || `Bekijk ons assortiment van ${brand.name}.`))
                            .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
                            .replace(/<meta[^>]*>/gi, '')
                            .replace(/<link[^>]*>/gi, '')
                            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    }}
                />
            </div>
        </div>
    </div>
  );


    // 1. Fetch Aggregations
    // Passing size 0 if categorized so we just get aggregations, else get 60 items.
    const brandEsRes = await searchProducts("", { brand: [slug] }, 1, 0); // Always set size 0 as we don't trust ES results
    
    // Extract Categories from ES (Counts might still be roughly correct even if IDs are old)
    const categoryFacet = brandEsRes.facets.find((f: any) => f.name === 'category');
    const categories = categoryFacet?.buckets.map((b: any) => ({
        id: b.key, 
        slug: b.key,
        name: b.label || b.key,
        count: b.doc_count
    })).sort((a: any, b: any) => a.name.localeCompare(b.name)) || [];
    
    // 2. Fetch Actual Products from Meilisearch
    const filters = [`brand_id = '${slug}'`];
    if (categorySlug) {
        filters.push(`category_slug = '${categorySlug}'`);
    }

    const { products: meiliHits, total: meiliTotal } = await fetchMeiliProducts(60, 0, "", filters);
    const allProductsCount = meiliTotal;
    
    // Map Meilisearch hits to the expected WooCommerce format for the ShopProductCard
    const filteredProducts = meiliHits.map(mapMeiliToWooProduct).filter(Boolean);

    return (
        <div className="max-w-[1440px] container mx-auto px-1 py-8">
            <div className="text-sm breadcrumbs mb-4 text-gray-500">
                <ul>
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/merken">Merken</Link></li>
                    <li className="font-semibold text-gray-900">{brand.name}</li>
                </ul>
            </div>

            
            
            
            <CategoryClient
                category={brand}
                subCategories={[]}
                currentSlug={[slug]}
                initialProducts={filteredProducts}
                initialTotalPages={Math.ceil(allProductsCount / 60) || 1}
                initialTotalProducts={allProductsCount}
                isBrandPage={true}
                customHero={customHero}
            />

            {/* FAQ Section */}
            {brand.acf?.faq_section && brand.acf.faq_section.length > 0 && (
                <>
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify({
                                "@context": "https://schema.org",
                                "@type": "FAQPage",
                                "mainEntity": brand.acf.faq_section.map(item => ({
                                    "@type": "Question",
                                    "name": item.brand_faq_question,
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": item.brand_faq_answer
                                    }
                                }))
                            })
                        }}
                    />
                    <div id="faq" className="mt-16 max-w-3xl mx-auto border-t border-gray-100 pt-16">
                        <h2 className="text-2xl font-bold mb-6 text-center">Veelgestelde vragen over {brand.name}</h2>
                        <div className="space-y-4">
                            {brand.acf.faq_section.map((item, index) => (
                                <details key={index} className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                                    <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                                        {item.brand_faq_question}
                                        <span className="transition group-open:rotate-180">
                                            <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                        </span>
                                    </summary>
                                    <div className="border-t border-gray-100 p-4 text-gray-600 bg-gray-50/50">
                                        <div dangerouslySetInnerHTML={{ __html: item.brand_faq_answer }} />
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}
