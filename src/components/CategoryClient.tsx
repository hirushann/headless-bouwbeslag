"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/woocommerce";
import ShopProductCard from "@/components/ShopProductCard";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

type AttributeTerm = {
  id: number;
  name: string;
};

type Attribute = {
  id: number;
  name: string;
  slug: string;
  terms: AttributeTerm[];
};

// Map Attribute Slugs (from Woo) to ACF Keys
// Inspect your console logs to find the correct slugs and ACF keys
const ATTRIBUTE_TO_ACF_MAP: Record<string, string> = {
  // Mappings based on generated slugs from Dutch names
  'nokmaat': 'camsize',
  'kleur': 'colors',
  'afwerking': 'finishes',
  'handleidingstaal': 'languages',
  'materiaal': 'materials',
  'verpakkingstype': 'packing_types',
  'schild-of-rozetuitvoering': 'rosette_type',
  'vorm': 'shape',
  'uitvoering': 'executions',
  'soort-kwaliteit': 'type_of_quality', // "Type of Quality" or "Soort Kwaliteit"? Assuming generic translation
  'binnen-buiten': 'site_addresses', // "Binnen / Buiten" -> site_addresses (based on user info)
  
  // Fallbacks if existing slugs somehow appear
  'pa_cam_size': 'camsize',
  'pa_color': 'colors',
};

type CategoryClientProps = {
  category: any;
  subCategories: any[];
  attributes: any[];
  currentSlug: string[];
};

export default function CategoryClient({
  category,
  subCategories,
  attributes,
  currentSlug,
}: CategoryClientProps) {
  // console.log("CategoryClient received category:", category);
  const [products, setProducts] = useState<any[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: number]: Set<number> }>({});
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [filtersLoading, setFiltersLoading] = useState<boolean>(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [sortBy, setSortBy] = useState<string>("");
  // const [activeSubCategories, setActiveSubCategories] = useState<Set<number>>(new Set()); // nested url change
  const [showFilters, setShowFilters] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize page from URL
  const initialPage = parseInt(searchParams.get("page") || "1");
  const [page, setPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [allCategoryProductsForFilters, setAllCategoryProductsForFilters] = useState<any[]>([]);

  // Sync state with URL when page changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());
    const newPathname = window.location.pathname + "?" + params.toString();
    // Use replace to avoid bloating history
    router.replace(newPathname, { scroll: false });
  }, [page, router]);

  useEffect(() => {
    async function fetchFilterBase() {
      if (!category) return;
      setFiltersLoading(true);
      try {
        // Fetch a larger batch (max 100) exactly once per category to determine available filters
        // Only fetch minimal fields to keep it fast
        const res = await fetch(`/api/products?per_page=100&category=${category.id}&_fields=id,attributes`);
        if (res.ok) {
           const data = await res.json();
          //  console.log(`🔍 Fetched ${data.length} products for global filter generation`);
           setAllCategoryProductsForFilters(data);
        }
      } catch (err) {
        // console.error("Failed to fetch filter base:", err);
      } finally {
        setFiltersLoading(false);
      }
    }
    fetchFilterBase();
  }, [category]);

  useEffect(() => {
    async function loadProducts() {
      if (!category) return;
      
      // console.log(`📦 Loading page ${page} for category ${category.name} (ID: ${category.id})`);
      setProductsLoading(true);
      // Clear current products to show skeletons and avoid showing wrong page data
      setProducts([]); 

      try {
        let params: any = { per_page: 20, page: page };

        // For nested URLs, we always just valid the current category's ID
        // The subcategory logic is now handled by navigating to a new URL
        params.category = category.id;

        if (sortBy) {
          if (sortBy === "price-low-high") {
            params.orderby = "price";
            params.order = "asc";
          } else if (sortBy === "price-high-low") {
            params.orderby = "price";
            params.order = "desc";
          } else {
            params.orderby = sortBy;
          }
        }

        // Use local API proxy to avoid CORS
        // Convert params object to query string
        const queryString = new URLSearchParams(params as any).toString();
        const res = await fetch(`/api/products?${queryString}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch products');
        
        const totalPagesHeader = res.headers.get('x-wp-totalpages');
        const totalItemsHeader = res.headers.get('x-wp-total');
        if (totalPagesHeader) setTotalPages(parseInt(totalPagesHeader));
        if (totalItemsHeader) setTotalProducts(parseInt(totalItemsHeader));

        const data = await res.json();
        setRawProducts(data);
        let prods = data;

        if (Object.keys(selectedFilters).length > 0) {
          prods = prods.filter((product: any) =>
            Object.entries(selectedFilters).every(([attrIdStr, termSet]) => {
              const attrId = Number(attrIdStr);
              const productAttr = product.attributes?.find((a: any) => a.id === attrId);
              if (!productAttr) return false;

              return productAttr.options.some((opt: string) => {
                const attr = attributes.find((a) => a.id === attrId);
                const term = attr?.terms.find((t: any) => t.name === opt);
                return termSet.has(term?.id);
              });
            })
          );
        }

        if (prods.length === 0 && data.length > 0) {
          console.warn("⚠️ All products from current page were filtered out localy!");
        }

        // console.log(`✅ Loaded ${prods.length} products for page ${page}`);
        setProducts(prods);
      } catch (err) {
        // console.error(err);
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, [category, selectedFilters, sortBy, page]);

  // Reset page when category OR filters OR sorting changes
  useEffect(() => {
    // Only reset if it's NOT the initial load from URL
    const urlPage = parseInt(searchParams.get("page") || "1");
    if (page !== 1 && urlPage === page) {
       // do nothing if they already match
    } else if (page !== 1) {
       setPage(1);
    }
  }, [category, selectedFilters, sortBy]);

  const toggleFilter = (attrId: number, termId: number) => {
    // Auto-close on mobile when selecting an item
    setShowFilters(false);

    setSelectedFilters(prev => {
      const newFilters: { [key: number]: Set<number> } = {};

      for (const [id, terms] of Object.entries(prev)) {
        newFilters[Number(id)] = new Set(terms);
      }

      if (!newFilters[attrId]) {
        newFilters[attrId] = new Set();
      }

      if (newFilters[attrId].has(termId)) {
        newFilters[attrId].delete(termId);
        if (newFilters[attrId].size === 0) {
          delete newFilters[attrId];
        }
      } else {
        newFilters[attrId].add(termId);
      }

      return newFilters;
    });
  };

  // ------------------------------------------------------------------
  // DYNAMIC FILTER LOGIC
  // Only show attributes/terms that exist in the currently loaded `rawProducts`.
  // AND match the ACF configuration from the category
  // ------------------------------------------------------------------
   const relevantAttributes = useMemo(() => {
    // If we have products for the current page, we can at least show those.
    // If we have the larger batch, we show all filters available in that batch.
    const sourceProducts = allCategoryProductsForFilters.length > 0 ? allCategoryProductsForFilters : rawProducts;

    if (!sourceProducts || sourceProducts.length === 0) return [];

    // 1. Collect all "Option Names" present for each Attribute ID
    const presentOptions = new Map<number, Set<string>>();

    sourceProducts.forEach((p) => {
      if (!Array.isArray(p.attributes)) return;
      p.attributes.forEach((pAttr: any) => {
        if (!presentOptions.has(pAttr.id)) {
          presentOptions.set(pAttr.id, new Set());
        }
        const set = presentOptions.get(pAttr.id)!;
        pAttr.options.forEach((opt: string) => set.add(opt));
      });
    });

      return attributes
      .map((attr) => {
        // ACF Filtering Logic
        if (category && category.acf) {
            // Determine the ACF key for this attribute
            
            // Client-side Polyfill for Slug if missing
            let slug = attr.slug;
            if (!slug && attr.name) {
                 slug = attr.name.toLowerCase()
                    .replace(/\s+\/\s+/g, '-') 
                    .replace(/\s+/g, '-')      
                    .replace(/[^\w\u00C0-\u00FF-]+/g, '')
                    .replace(/-+/g, '-');
            }

            let acfKey = ATTRIBUTE_TO_ACF_MAP[slug];
            
            // Fallback: Try to derive it if not in map
            if (!acfKey && slug) {
                // e.g. pa_packing-types -> packing_types
                acfKey = slug.replace(/^pa_/, '').replace(/-/g, '_');
            } else if (!slug) {
                 console.warn(`⚠️ Attribute has NO SLUG and NO NAME to generate from:`, attr);
            }
            
            if (acfKey && category.acf) {
                const isEnabled = category.acf[acfKey];

                // Check for boolean false or string "false"
                if (isEnabled === false || isEnabled === "false") {
                     return null;
                } else {
                    //  console.log(`✅ ALLOWED Attribute: ${attr.name} (ACF check passed or indeterminate)`);
                }
            } else {
                //  console.log(`⚠️ NO ACF MAPPING/KEY for Attribute: ${attr.name} (${slug}). Defaulting to ALLOWED.`);
            }
        }

        const presentSet = presentOptions.get(attr.id);

        if (!presentSet) {
             return null; 
        }

        // (WooCommerce API matches terms by Name in the product.attributes.options array)
        // Normalize for comparison
        const validTerms = attr.terms.filter((term: AttributeTerm) => {
            const match = Array.from(presentSet).some(pOpt => pOpt.trim().toLowerCase() === term.name.trim().toLowerCase());
            return match;
        });

        if (validTerms.length === 0) return null;

        return {
          ...attr,
          terms: validTerms,
        };
      })
      .filter(Boolean) as Attribute[];
  }, [allCategoryProductsForFilters, rawProducts, attributes, category]);

  // console.log("🔥 FINAL RELEVANT ATTRIBUTES:", relevantAttributes.map(a => a.name));

  const colorAttribute = relevantAttributes.find(
    (attr) => attr.name.toLowerCase() === "color"
  );

  const otherAttributes = relevantAttributes.filter(
    (attr) => attr.name.toLowerCase() !== "color"
  );

  return (
    <div className="bg-[#F7F7F7] min-h-screen">
      <div className="max-w-[1440px] mx-auto py-8 px-5 lg:px-0">
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-8">
          
          <aside className="w-full lg:w-1/4 relative">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className={`${showFilters ? 'block' : 'hidden'} lg:hidden block absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition`}
              aria-label="Close Filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
            <div
              id="filters-section"
              className={`${showFilters ? 'max-h-screen opacity-100 p-4' : 'max-h-0 opacity-0 lg:p-4'} overflow-hidden transition-all duration-300 ease-in-out lg:max-h-full lg:opacity-100 lg:block bg-white rounded-lg`}
            >
              {filtersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Color Filter First */}
                  {colorAttribute && (
                    <div key={colorAttribute.id} className="mb-6">
                      <h3 className="font-medium mb-3 text-[#212121] text-lg">{colorAttribute.name}</h3>
                      <div className="grid grid-cols-5 gap-4">
                        {(showAllColors ? colorAttribute.terms : colorAttribute.terms.slice(0, 10)).map(
                          (term: AttributeTerm) => {
                          const isSelected = selectedFilters[colorAttribute.id]?.has(term.id) || false;
                          return (
                            <div key={term.id} className="flex flex-col items-center">
                              <button
                                type="button"
                                className={`w-8 h-8 rounded-full border-2 ${isSelected ? 'ring-2 ring-blue-500' : 'border-gray-300'}`}
                                style={{ backgroundColor: term.name.toLowerCase() }}
                                onClick={() => toggleFilter(colorAttribute.id, term.id)}
                                aria-label={term.name}
                              />
                              <span className="mt-1 text-xs text-center text-gray-700">{term.name}</span>
                            </div>
                          );
                        })}
                      </div>
                      {colorAttribute.terms.length > 10 && !showAllColors && (
                        <button
                          type="button"
                          className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                          onClick={() => setShowAllColors(true)}
                        >
                          Bekijk alle kleuren
                        </button>
                      )}
                    </div>
                  )}

                  {/* Other Attributes */}
                  {otherAttributes.map(attr => (
                    <div key={attr.id} className="mb-8">
                      <h3 className="font-medium mb-3 text-[#212121] text-lg">{attr.name}</h3>
                      <div className="flex flex-col gap-2 text-sm text-gray-700">
                        {attr.terms.map((term: AttributeTerm) => (
                          <label key={term.id} className="flex items-start gap-1">
                            <div className="w-5">
                                <input
                                type="checkbox"
                                className="mr-2 w-5 h-5 rounded-sm border border-gray-300 text-[#0066FF] focus:ring-0 focus:ring-offset-0"
                                checked={selectedFilters[attr.id]?.has(term.id) || false}
                                onChange={() => toggleFilter(attr.id, term.id)}
                                />
                            </div>
                            {term.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setSelectedFilters({})} className="text-sm text-red-500 hover:underline mb-4">Filters wissen</button>
                </>
              )}
            </div>
            </motion.div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex justify-between items-end mb-4 sticky top-[88px] bg-[#F7F7F7] z-40 py-4 -mx-5 px-5 lg:static lg:p-0 lg:mx-0"> 
              <h1 className="text-xl lg:text-3xl font-bold">{category?.name ?? "Category"}</h1>
              <div className='flex gap-3 '>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select focus:outline-0 focus:ring-0 w-32 border border-[#808D9A] rounded-sm bg-[F7F7F7] h-8 w-full">
                  <option disabled={true} value="">Sorteer op</option>
                  <option value="popularity">Populariteit</option>
                  <option value="rating">Beoordeling</option>
                  <option value="latest">Nieuwste</option>
                  <option value="price-low-high">Prijs: Laag naar Hoog</option>
                  <option value="price-high-low">Prijs: Hoog naar Laag</option>
                </select>
                <button type="button" className="lg:hidden px-2 py-1 w-auto text-left bg-white border border-gray-300 rounded-md font-medium" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-controls="filters-section">
                  {showFilters ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Subcategories */}
            <div className='flex gap-4 pb-4 flex-wrap'>
              {subCategories.map((sub) => {
                const parentPath = currentSlug.join("/");
                // Ensure no double slashes if something is weird, though join should be fine
                const href = `/${parentPath}/${sub.slug}`;
                
                return (
                  <Link
                    key={sub.id}
                    href={href}
                    className="px-3.5 py-1.5 rounded-sm text-sm font-medium border border-[#D0DFEE] bg-[#F2F7FF] text-[#4F4F4F] cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                    {sub.name}
                  </Link>
                );
              })}
            </div>

            {/* Products Grid */}
            {productsLoading && products.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 lg:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <p>Geen producten gevonden in deze categorie.</p>
            ) : (
              <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 lg:gap-6"
              >
                {products.map((product) => (
                  <motion.div key={product.id} variants={item} className="h-full">
                    <ShopProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-12 mb-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPage(prev => Math.max(1, prev - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                    Vorige
                  </button>
                  
                  <div className="flex gap-1 overflow-x-auto py-1 scrollbar-hide">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                      const isVisible = totalPages <= 5 || p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1);
                      const isEllipsis = totalPages > 5 && (p === 2 && page > 3 || p === totalPages - 1 && page < totalPages - 2);

                      if (isVisible) {
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              setPage(p);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-10 h-10 flex-shrink-0 rounded-md border font-bold transition-all cursor-pointer text-sm ${
                              page === p
                                ? "bg-[#0066FF] border-[#0066FF] text-white shadow-md shadow-blue-100"
                                : "bg-white border-gray-300 text-gray-600 hover:border-[#0066FF] hover:text-[#0066FF]"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      } else if (isEllipsis) {
                        // Avoid double dots
                        if (p === 2 && page > 3) return <span key={`dots-start`} className="flex items-center justify-center w-8 text-gray-400">...</span>;
                        if (p === totalPages - 1 && page < totalPages - 2) return <span key={`dots-end`} className="flex items-center justify-center w-8 text-gray-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setPage(prev => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                  >
                    Volgende
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Pagina {page} van {totalPages} ({totalProducts} producten)
                </div>
              </div>
            )}

            {/* Category description above subcategories */}
            {category?.description && (
              <div
                className="my-6 prose prose-blue max-w-none leading-relaxed text-gray-800 category-description-style"
                dangerouslySetInnerHTML={{ __html: category.description }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}