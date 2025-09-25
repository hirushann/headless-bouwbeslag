"use client";
import React, { useState, useEffect, use } from 'react';
import ProductCard from '@/components/ProductCard';
import api from "@/lib/woocommerce";
import ShopProductCard from '@/components/ShopProductCard';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface Product {
  id: number;
  name: string;
  price: string;
  stock_status: string;
  images: { src: string; alt: string }[];
  [key: string]: any;
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

interface Params {
  params: {
    slug: string;
  };
}

async function fetchCategory(slug: string): Promise<Category | null> {
  const res = await api.get("products/categories", { slug });
  if (!res.data || res.data.length === 0) return null;
  return res.data[0];
}

async function fetchAttributes(): Promise<Attribute[]> {
  const res = await api.get("products/attributes");
  const attributesData = res.data || [];
  const attributesWithTerms: Attribute[] = [];

  for (const attr of attributesData) {
    const termsRes = await fetchTermsForAttribute(attr.id);
    attributesWithTerms.push({
      id: attr.id,
      name: attr.name,
      terms: termsRes,
    });
  }

  return attributesWithTerms;
}

async function fetchTermsForAttribute(attributeId: number): Promise<AttributeTerm[]> {
  const res = await api.get(`products/attributes/${attributeId}/terms`);
  return res.data || [];
}

export default function CategoryPage({ params }: Params) {
  const { slug } = use(params);
  const [category, setCategory] = useState<Category | null>(null);
  const [categoryLoading, setCategoryLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: number]: Set<number> }>({});
  const [filtersLoading, setFiltersLoading] = useState<boolean>(false);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [sortBy, setSortBy] = useState<string>("");
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [activeSubCategories, setActiveSubCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function loadCategory() {
      setCategoryLoading(true);
      try {
        const cat = await fetchCategory(slug);
        if (!cat) {
          setCategory(null);
          return;
        }
        setCategory(cat);
      } finally {
        setCategoryLoading(false);
      }
    }
    loadCategory();
  }, [slug]);

  useEffect(() => {
    async function loadSubCategories() {
      if (!category) return;
      const res = await api.get("products/categories", { parent: category.id });
      setSubCategories(res.data || []);
      setActiveSubCategories(new Set());
    }
    loadSubCategories();
  }, [category]);

  useEffect(() => {
    async function loadAttributes() {
      setFiltersLoading(true);
      const attrs = await fetchAttributes();
      setAttributes(attrs);
      setFiltersLoading(false);
    }
    loadAttributes();
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
          switch (sortBy) {
            case "popularity":
              params.orderby = "popularity";
              break;
            case "rating":
              params.orderby = "rating";
              break;
            case "latest":
              params.orderby = "date";
              params.order = "desc";
              break;
            case "price-low-high":
              params.orderby = "price";
              params.order = "asc";
              break;
            case "price-high-low":
              params.orderby = "price";
              params.order = "desc";
              break;
            default:
              break;
          }
        }

        const res = await api.get("products", params);
        let prods: Product[] = res.data;

        if (Object.keys(selectedFilters).length > 0) {
          prods = prods.filter(product => {
            return Object.entries(selectedFilters).every(([attrIdStr, termSet]) => {
              const attrId = Number(attrIdStr);
              const productAttributes = product.attributes || [];
              const productAttr = productAttributes.find((a: any) => a.id === attrId);
              if (!productAttr) return false;
              return productAttr.options.some((opt: string) => {
                const attr = attributes.find(a => a.id === attrId);
                if (!attr) return false;
                const term = attr.terms.find(t => t.name === opt);
                if (!term) return false;
                return termSet.has(term.id);
              });
            });
          });
        }

        setProducts(prods);
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, [category, selectedFilters, attributes, sortBy, activeSubCategories]);

if (categoryLoading) {
  return (
    <div className="bg-[#F7F7F7]">
      <div className="max-w-[1440px] mx-auto py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Skeleton */}
          <aside className="w-full lg:w-1/4">
            <div className="border-0 bg-white p-4 rounded-lg space-y-4">
              <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse"></div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </aside>

          {/* Products Skeleton */}
          <main className="flex-1">
            <div className="flex justify-between items-start mb-6">
              <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

  if (!categoryLoading && category === null) {
    return <p>Category not found.</p>;
  }

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

  const colorAttribute = attributes.find(attr => attr.name.toLowerCase() === "color");
  const otherAttributes = attributes.filter(attr => attr.name.toLowerCase() !== "color");

  return (
    <div className="bg-[#F7F7F7]">
      <div className="max-w-[1440px] mx-auto py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-1/4">
            <nav className="mb-8 text-sm flex gap-2">
              <a href="/" className="hover:underline flex items-center gap-2 font-medium text-sm text-[#4F4F4F]">
                <span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg></span>
                <span>Home</span>
              </a> / <span className='text-[#9C9C9C]'>{category.name}</span>
            </nav>
            <div className='border-0 bg-white p-4 rounded-lg'>
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
                        {(showAllColors ? colorAttribute.terms : colorAttribute.terms.slice(0, 10)).map(term => {
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
                          View all Colours
                        </button>
                      )}
                    </div>
                  )}

                  {/* Other Attributes */}
                  {otherAttributes.map(attr => (
                    <div key={attr.id} className="mb-8">
                      <h3 className="font-medium mb-3 text-[#212121] text-lg">{attr.name}</h3>
                      <div className="flex flex-col gap-2 text-sm text-gray-700">
                        {attr.terms.map(term => (
                          <label key={term.id} className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2 w-5 h-5 rounded-sm border border-gray-300 text-[#0066FF] focus:ring-0 focus:ring-offset-0"
                              checked={selectedFilters[attr.id]?.has(term.id) || false}
                              onChange={() => toggleFilter(attr.id, term.id)}
                            />
                            {term.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setSelectedFilters({})} className="text-sm text-red-500 hover:underline mb-4">Clear Filters</button>
                </>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold">{category.name}</h1>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select focus:outline-0 focus:ring-0 w-32 border border-[#808D9A] rounded-sm bg-[F7F7F7] h-8">
                <option disabled={true} value="">Sort by</option>
                <option value="popularity">Popularity</option>
                <option value="rating">Rating</option>
                <option value="latest">Latest</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
              </select>
            </div>

            <div className='flex gap-4 pb-4 flex-wrap'>
              {subCategories.map((sub) => (
                <button
                  key={sub.id}
                  className={`px-3.5 py-1.5 rounded-sm text-sm font-medium border border-[#D0DFEE] bg-[#F2F7FF] text-[#4F4F4F] cursor-pointer ${
                activeSubCategories.has(sub.id) ? 'bg-[#F2F7FF] text-[#0066FF] border-[#0066FF]' : 'bg-white text-gray-700 border-gray-300'
                  }`}
                  onClick={() => {
                    setActiveSubCategories(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(sub.id)) {
                        newSet.delete(sub.id);
                      } else {
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <p>No products found in this category.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ShopProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
