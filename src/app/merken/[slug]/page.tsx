import { getBrand, fetchProducts, getProductsByBrand } from "@/lib/woocommerce";
import Link from "next/link";
import { notFound } from "next/navigation";
import ShopProductCard from "@/components/ShopProductCard";

export const dynamic = 'force-dynamic';

export default async function BrandPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ category?: string }> }) {
    const { slug } = await params;
    const { category: categorySlug } = await searchParams;
    const brand = await getBrand(slug);

    console.log("Brand Data Response:", JSON.stringify(brand, null, 2));

    if (!brand) {
        notFound();
    }

    // Fetch products for this brand using the specialized function to ensure correct filtering
    const allProducts = await getProductsByBrand(brand.id, 100);

    // Extract categories from products
    const categoriesMap = new Map<string, { id: number, name: string, slug: string, count: number }>();
    
    allProducts.forEach((product: any) => {
        if (product.categories) {
            product.categories.forEach((cat: any) => {
                 if (!categoriesMap.has(cat.slug)) {
                     categoriesMap.set(cat.slug, { ...cat, count: 0 });
                 }
                 categoriesMap.get(cat.slug)!.count++;
            });
        }
    });

    const categories = Array.from(categoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Filter products if category selected
    const filteredProducts = categorySlug 
        ? allProducts.filter((p: any) => p.categories.some((c: any) => c.slug === categorySlug))
        : allProducts;

    return (
        <div className="max-w-[1440px] container mx-auto px-1 py-8">
            <div className="text-sm breadcrumbs mb-4 text-gray-500">
                <ul>
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/merken">Merken</Link></li>
                    <li className="font-semibold text-gray-900">{brand.name}</li>
                </ul>
            </div>

            {/* Brand Header / Hero */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="w-full md:w-1/4 max-w-[200px] aspect-square flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 p-4">
                         {brand.acf?.brand_logo ? (
                             <img 
                                src={typeof brand.acf.brand_logo === 'string' ? brand.acf.brand_logo : (brand.acf.brand_logo as any).url} 
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
                            dangerouslySetInnerHTML={{ __html: brand.acf?.brand_description || brand.description || `Bekijk ons assortiment van ${brand.name}.` }}
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full lg:w-1/4 flex-none">
                     <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
                        <h3 className="font-bold text-lg mb-4 text-gray-900">Categorieën</h3>
                        <ul className="space-y-2">
                             <li>
                                <Link 
                                    href={`/merken/${slug}`}
                                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${!categorySlug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <span>Alle producten</span>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{allProducts.length}</span>
                                </Link>
                            </li>
                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    <Link 
                                        href={`/merken/${slug}?category=${cat.slug}`}
                                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${categorySlug === cat.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <span>{cat.name}</span>
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{cat.count}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                     </div>
                </aside>

                {/* Products Grid */}
                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-6">Producten van {brand.name} {categorySlug && <span className="text-gray-400 font-normal text-lg">in {categories.find(c => c.slug === categorySlug)?.name}</span>}</h2>
                    
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 lg:gap-6">
                            {filteredProducts.map((product: any) => (
                                <div key={product.id} className="h-full">
                                    <ShopProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            <p>Geen producten gevonden in deze categorie.</p>
                            <Link href={`/merken/${slug}`} className="text-blue-600 hover:underscore mt-2 inline-block">Bekijk alle producten van {brand.name}</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* FAQ Section */}
            {brand.acf?.faq && brand.acf.faq.length > 0 && (
                <div className="mt-16 max-w-3xl mx-auto border-t border-gray-100 pt-16">
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
