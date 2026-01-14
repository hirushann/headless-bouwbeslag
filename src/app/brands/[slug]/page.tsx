import { getBrand, fetchProducts } from "@/lib/woocommerce";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/app/[...slug]/ProductPageClient"; // Or a reusable ProductCard component. 
// Wait, ProductPageClient is the full page. I need a Product Card component.
// checking codebase for ProductCard...
// I don't see a clear reusable ProductCard component in the file list earlier.
// I might need to implement a simple one or find where products are listed (e.g. Category page).
// Let's assume I need to build a simple grid or reuse one.
// src/app/categories/page.tsx or similar might have one. 
// For now, I'll build a simple inline card to ensure functionality.

export const dynamic = 'force-dynamic';

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const brand = await getBrand(slug);

    if (!brand) {
        notFound();
    }

    // Fetch products for this brand
    // Trying 'product_brand' param with ID. this is common for YITH or WC Brands.
    const products = await fetchProducts({ product_brand: brand.id, per_page: 20 });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-sm breadcrumbs mb-4 text-gray-500">
                <ul>
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/brands">Merken</Link></li>
                    <li className="font-semibold text-gray-900">{brand.name}</li>
                </ul>
            </div>

            {/* Brand Header / Hero */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-1/4 max-w-[200px] aspect-square flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 p-4">
                         {brand.acf?.brand_image ? (
                             <img 
                                src={typeof brand.acf.brand_image === 'string' ? brand.acf.brand_image : (brand.acf.brand_image as any).url} 
                                alt={brand.name} 
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <span className="text-3xl font-bold text-gray-300">{brand.name}</span>
                        )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-4 text-gray-900">{brand.name}</h1>
                        <div 
                            className="prose prose-sm max-w-none text-gray-600"
                            dangerouslySetInnerHTML={{ __html: brand.description || `Bekijk ons assortiment van ${brand.name}.` }}
                        />
                    </div>
                </div>
            </div>
            
            {/* Products Grid */}
            <h2 className="text-2xl font-bold mb-6">Producten van {brand.name}</h2>
            
            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product: any) => (
                         <Link key={product.id} href={`/${product.slug}`} className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                            <div className="aspect-square relative bg-gray-50 overflow-hidden">
                                {product.images && product.images[0] ? (
                                    <img 
                                        src={product.images[0].src} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-medium text-gray-900 line-clamp-2 min-h-[3rem] group-hover:text-blue-600 transition-colors">
                                    {product.name}
                                </h3>
                                <div className="mt-2 flex items-baseline gap-2">
                                     <span className="text-lg font-bold text-gray-900">€{parseFloat(product.price).toFixed(2)}</span>
                                     {product.regular_price && product.price < product.regular_price && (
                                         <span className="text-sm text-gray-400 line-through">€{parseFloat(product.regular_price).toFixed(2)}</span>
                                     )}
                                </div>
                            </div>
                         </Link>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                    <p>Geen producten gevonden voor dit merk.</p>
                </div>
            )}

            {/* FAQ Section */}
            {brand.acf?.faq && brand.acf.faq.length > 0 && (
                <div className="mt-16 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 text-center">Veelgestelde vragen over {brand.name}</h2>
                    <div className="space-y-4">
                        {brand.acf.faq.map((item, index) => (
                            <details key={index} className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-gray-900 hover:bg-gray-50 transition-colors">
                                    {item.question}
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="border-t border-gray-100 p-4 text-gray-600 bg-gray-50/50">
                                    {item.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
