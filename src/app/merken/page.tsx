import { getBrands, getBrand } from "@/lib/woocommerce";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { Metadata } from 'next';
import { BOUWBESLAG_CONTENT_TAGS } from "@/lib/cache-tags";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: "/merken" },
  title: 'Onze Merken | Bouwbeslag',
  description: 'Ontdek alle topmerken bouwbeslag en deurbeslag in ons uitgebreide assortiment.',
};

export default async function BrandsPage() {
    const brands = await getBrands();
    
    // Fetch product counts per brand from Meilisearch
    let brandCounts: Record<string, number> = {};
    try {
        const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'https://ezearch.dayzsolutions.com';
        const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || '';
        const MEILI_INDEX = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || 'empire-bouwbeslag-products';
        
        const res = await fetch(`${MEILISEARCH_HOST}/indexes/${MEILI_INDEX}/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MEILISEARCH_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: '', limit: 0, facets: ['brand_name'] }),
            next: { revalidate: 3600, tags: BOUWBESLAG_CONTENT_TAGS }
        });
        
        if (res.ok) {
            const data = await res.json();
            brandCounts = data.facetDistribution?.brand_name || {};
            console.log("brandCounts:", brandCounts);
        } else {
            console.log("Meilisearch res not ok:", await res.text());
        }
    } catch (e) {
        console.error('Failed to fetch brand counts from Meilisearch', e);
    }

    // Map the counts (case-insensitive fallback)
    const getCount = (name: string) => {
        if (brandCounts[name]) return brandCounts[name];
        const lowerName = name.toLowerCase();
        const key = Object.keys(brandCounts).find(k => k.toLowerCase() === lowerName);
        return key ? brandCounts[key] : 0;
    };

    const brandsWithCounts = brands.map(brand => ({
        ...brand,
        count: getCount(brand.name)
    }));

    return (
        <div className="max-w-[1440px] container mx-auto px-1 py-8">
             <div className="text-sm breadcrumbs mb-4 text-gray-500">
                <ul>
                    <li><Link href="/">Home</Link></li>
                    <li>Merken</li>
                </ul>
            </div>

            <h1 className="text-3xl font-bold mb-8">Onze Merken</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {brandsWithCounts.length > 0 ? (
                    brandsWithCounts.map((brand) => (
                        <Link 
                            key={brand.id} 
                            href={`/merken/${brand.slug}`}
                            className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden"
                        >
                            <div className="aspect-square p-6 flex items-center justify-center bg-gray-50 group-hover:bg-white transition-colors relative">
                                {/* Place holder or Actual Image if available */}
                                {/* Logic to extract image from ACF or embedded if possible. 
                                    Since we saw no obvious image data, we use a placeholder or name for now.
                                */}
                                {brand.acf?.brand_logo ? (
                                     <Image 
                                        src={typeof brand.acf.brand_logo === 'string' ? brand.acf.brand_logo : (brand.acf.brand_logo as any).url} 
                                        alt={brand.name} 
                                        fill
                                        sizes="(max-width: 768px) 50vw, 200px"
                                        className="object-contain p-6" // grayscale group-hover:grayscale-0 transition-all
                                    />
                                ) : (
                                    <span className="text-xl font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                                        {brand.name}
                                    </span>
                                )}
                            </div>
                            <div className="p-4 text-center border-t border-gray-50">
                                <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center justify-center gap-1">
                                    {brand.name}
                                    <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">{brand.count} producten</p>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        Geen merken gevonden.
                    </div>
                )}
            </div>
        </div>
    );
}
