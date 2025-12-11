"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/woocommerce";
import ShopProductCard from "@/components/ShopProductCard";
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
  terms: AttributeTerm[];
};

type CategoryClientProps = {
  category: any;
  subCategories: any[];
  attributes: any[];
};

export default function CategoryClient({
  category,
  subCategories,
  attributes,
}: CategoryClientProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: number]: Set<number> }>({});
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [filtersLoading, setFiltersLoading] = useState<boolean>(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [sortBy, setSortBy] = useState<string>("");
  const [activeSubCategories, setActiveSubCategories] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setFiltersLoading(false);
  }, []);

  useEffect(() => {
    async function loadProducts() {
      if (!category) return;

      setProductsLoading(true);

      try {
        let params: any = { per_page: 20 };

        if (activeSubCategories.size > 0) {
          params.category = Array.from(activeSubCategories).join(",");
        } else {
          params.category = category.id;
        }

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

        const res = await api.get("products", params);
        setRawProducts(res.data);
        let prods = res.data;

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

        setProducts(prods);
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, [category, selectedFilters, sortBy, activeSubCategories]);

  const toggleFilter = (attrId: number, termId: number) => {
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
  // ------------------------------------------------------------------
  const relevantAttributes = useMemo(() => {
    if (!rawProducts || rawProducts.length === 0) return [];

    // 1. Collect all "Option Names" present for each Attribute ID
    const presentOptions = new Map<number, Set<string>>();

    rawProducts.forEach((p) => {
      if (!Array.isArray(p.attributes)) return;
      p.attributes.forEach((pAttr: any) => {
        // pAttr = { id: 1, name: "Color", options: ["Blue", "Red"] }
        if (!presentOptions.has(pAttr.id)) {
          presentOptions.set(pAttr.id, new Set());
        }
        const set = presentOptions.get(pAttr.id)!;
        pAttr.options.forEach((opt: string) => set.add(opt));
      });
    });

    // 2. Filter the Global Attributes list
    return attributes
      .map((attr) => {
        const presentSet = presentOptions.get(attr.id);
        if (!presentSet) return null; // Attribute ID not found in any product

        // Filter terms: keep term only if its NAME is in the presentSet
        // (WooCommerce API matches terms by Name in the product.attributes.options array)
        const validTerms = attr.terms.filter((term: AttributeTerm) =>
          presentSet.has(term.name)
        );

        if (validTerms.length === 0) return null;

        return {
          ...attr,
          terms: validTerms,
        };
      })
      .filter(Boolean) as Attribute[];
  }, [rawProducts, attributes]);

  const colorAttribute = relevantAttributes.find(
    (attr) => attr.name.toLowerCase() === "color"
  );

  const otherAttributes = relevantAttributes.filter(
    (attr) => attr.name.toLowerCase() !== "color"
  );

  return (
    <div className="bg-[#F7F7F7]">
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
            <div className="flex justify-between items-end mb-4">
              <p className="text-3xl font-bold">{category?.name ?? "Category"}</p>
              <div className='flex gap-3 '>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select focus:outline-0 focus:ring-0 w-32 border border-[#808D9A] rounded-sm bg-[F7F7F7] h-8">
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
              {subCategories.map((sub) => (
                <button
                  key={sub.id}
                  className={`px-3.5 py-1.5 rounded-sm text-sm font-medium border border-[#D0DFEE] bg-[#F2F7FF] text-[#4F4F4F] cursor-pointer ${
                    activeSubCategories.has(sub.id)
                      ? 'bg-[#F2F7FF] text-[#0066FF] border-[#0066FF]'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  onClick={() => {
                    setActiveSubCategories((prev) => {
                      const newSet = new Set(prev);
                      if (newSet.has(sub.id)) {
                        newSet.delete(sub.id);
                      } else {
                        newSet.clear(); // Only allow one active subcategory at a time
                        newSet.add(sub.id);
                      }
                      return newSet;
                    });
                  }}
                >
                  {sub.name}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {productsLoading && products.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 lg:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
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

            {/* Category description above subcategories */}
            {category?.description && (
              <div
                className="my-6 prose prose-blue max-w-none leading-relaxed text-gray-800 category-description-style"
                dangerouslySetInnerHTML={{ __html: category.description }}
              />
            )}

            {/* Show subcategory description below if selected */}
            {Array.from(activeSubCategories).length === 1 && (() => {
              const selectedSub = subCategories.find(
                (s) => s.id === Array.from(activeSubCategories)[0]
              );
              return (
                selectedSub?.description && (
                  <div
                    className="mt-4 mb-8 prose prose-blue max-w-none leading-relaxed text-gray-800 category-description-style"
                    dangerouslySetInnerHTML={{ __html: selectedSub.description }}
                  />
                )
              );
            })()}
          </main>
        </div>
      </div>
    </div>
  );
}