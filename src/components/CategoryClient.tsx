"use client";

import { useEffect, useState, useMemo, useRef, use, Suspense } from "react";

import api from "@/lib/woocommerce";
import ShopProductCard from "@/components/ShopProductCard";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import CategoryBreadcrumbs from "@/components/CategoryBreadcrumbs";
import DualRangeSlider from "@/components/DualRangeSlider";
import { COLOR_MAP } from "@/config/colorMap";

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
  count?: number;
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
  // Map Based on literal names (lowercased & hyphenated)
  'nokmaat': 'camsize',
  'kleur': 'colors',
  'afwerking': 'finishes',
  'binnen-buiten': 'site_addresses',
  'handleidingstaal': 'languages',
  'materiaal': 'materials',
  'maximale-deurdikte': 'max_door_thickness',
  'eenheid-maximale-deurdikte': 'max_door_thickness', // mapping to same key if applicable
  'minimale-deurdikte': 'min_door_thickness',
  'eenheid-minimale-deurdikte': 'min_door_thickness',
  'inhoud-van-de-verpakking': 'package_content',
  'verpakkingstype': 'packing_types',
  'rosette-type': 'rosette_type',
  'series': 'series',
  'schild-of-rozetuitvoering': 'rosette_type',
  'stijl': 'styles',
  'soort-kwaliteit': 'type_of_quality',
  'uitvoering': 'executions',
  'vorm': 'shape',
  'voorplaatbreedte': 'front_plate_width',
  'raamtype': 'window_type',
  'lengte': 'length',
  'raamuitzetter': 'window_stay',
  'krukhoogte': 'handle_height',
  'doornmaat': 'spindle',
  'merk': 'marking',
  'verzet': 'offset',
  'haak-type': 'hook_type',
  'deurbeslagset-type': 'type_of_door_fitting_set',
  'kerntrekbeveiliging': 'with_core_pulling_protection',
  'brandvertragend': 'brandvertragend',
  'tochtstrips-type': 'type_tochtstrip',
  'tochtstrips-toepassing': 'tochtstrip_toepassing',
  'tochtstrips-breedte': 'breedte_tochtstrip',
  'groefdiepte': 'groefdiepte',
  'afdichtingsspleet': 'afdichtingsspleet',
  'groefbreedte': 'groefbreedte',
  'leverancier': 'suppliers',

  // Common fallbacks
  'color': 'colors',
  'finish': 'finishes',
  'material': 'materials',
  'pa_color': 'colors',
  'pa_finish': 'finishes',
  'pa_material': 'materials',
};

type CategoryClientProps = {
  category: any;
  subCategories: any[] | Promise<any[]>;
  attributes: any[] | Promise<any[]>;
  currentSlug: string[];
  initialProducts?: any[];
  initialTotalPages?: number;
  initialTotalProducts?: number;
  initialFilterBaseProducts?: any[] | Promise<any[]>;
};


function FilterAttributeGroup({
  attr,
  selectedFilters,
  toggleFilter
}: {
  attr: Attribute;
  selectedFilters: { [key: number]: Set<number> };
  toggleFilter: (attrId: number, termId: number) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // If there's only 1 option, CategoryClient already filters it out, but let's be safe.
  if (attr.terms.length <= 1) return null;

  const visibleTerms = showAll ? attr.terms : attr.terms.slice(0, 5);

  return (
    <div className="mb-4 border-b border-[#F7F7F7] pb-4 last:border-0 last:pb-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full group py-2"
      >
        <h3 className="font-semibold text-lg text-[#212121] capitalize group-hover:text-[#0066FF] transition-colors">{attr.name}</h3>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="flex flex-col gap-2 text-sm text-gray-700 mt-2"
        >
          {visibleTerms.map((term: AttributeTerm) => {
            const isSelected = selectedFilters[attr.id]?.has(term.id) || false;
            return (
              <label key={term.id} className={`flex items-start gap-1 cursor-pointer transition-opacity ${term.count === 0 && !isSelected ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}>
                <div className="w-5">
                  <input
                    type="checkbox"
                    className="mr-2 w-5 h-5 rounded-sm border border-gray-300 text-[#0066FF] focus:ring-0 focus:ring-offset-0"
                    checked={isSelected}
                    onChange={() => toggleFilter(attr.id, term.id)}
                  />
                </div>
                <span className="flex-1">
                  {term.name === "1" ? "Ja" : term.name === "0" ? "Nee" : term.name}
                  {term.count !== undefined && <span className="ml-1 text-gray-400 text-[10px] sm:text-xs">({term.count})</span>}
                </span>
              </label>
            );
          })}
          {attr.terms.length > 5 && (
            <button
              type="button"
              className="mt-2 text-left text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "Toon minder" : `Toon meer (${attr.terms.length - 5})`}
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}

function SubCategoryGrid({ 
  subCategories: subCategoriesProp, 
  currentSlug 
}: { 
  subCategories: any[] | Promise<any[]>, 
  currentSlug: string[] 
}) {
  const subCategories = typeof (subCategoriesProp as any).then === 'function' 
    ? use(subCategoriesProp as Promise<any[]>) 
    : subCategoriesProp as any[];

  if (!subCategories || subCategories.length === 0) return null;

  return (
    <div className='flex gap-4 pb-4 flex-nowrap lg:flex-wrap w-full overflow-x-auto'>
      {subCategories.map((sub: any) => {
        const parentPath = currentSlug.join("/");
        const href = `/${parentPath}/${sub.slug}`;
        return (
          <Link
            key={sub.id}
            prefetch={true}
            href={href}
            className="min-w-fit px-3.5 py-1.5 rounded-sm text-sm font-medium border border-[#D0DFEE] bg-[#F2F7FF] text-[#4F4F4F] cursor-pointer hover:bg-blue-50 transition-colors"
          >
            {sub.name}
          </Link>
        );
      })}
    </div>
  );
}

interface FilterSidebarProps {
  attributes: any[] | Promise<any[]>;
  initialFilterBaseProducts: any[] | Promise<any[]>;
  category: any;
  selectedFilters: { [key: number]: Set<number> };
  toggleFilter: (attrId: number, termId: number) => void;
  resetFilters: () => void;
  afdichtingsspleetRange: [number, number] | null;
  groefbreedteRange: [number, number] | null;
  setAfdichtingsspleetRange: (r: [number, number] | null) => void;
  setGroefbreedteRange: (r: [number, number] | null) => void;
  showFilters: boolean;
  setShowFilters: (s: boolean) => void;
}

function FilterSidebar({
  attributes: attributesProp,
  initialFilterBaseProducts: filterBaseProp,
  category,
  selectedFilters,
  toggleFilter,
  resetFilters,
  afdichtingsspleetRange,
  groefbreedteRange,
  setAfdichtingsspleetRange,
  setGroefbreedteRange,
  showFilters,
  setShowFilters
}: FilterSidebarProps) {
  const attributes = typeof (attributesProp as any).then === 'function' 
    ? use(attributesProp as Promise<Attribute[]>) 
    : attributesProp as Attribute[];
    
  const allCategoryProductsForFilters = typeof (filterBaseProp as any).then === 'function'
    ? use(filterBaseProp as Promise<any[]>)
    : filterBaseProp as any[];

  const [showAllColors, setShowAllColors] = useState(false);

  // Re-implement checkGlobalMatch logic locally for the sidebar faceted counting
  const checkGlobalMatchLocal = (p: any, excludeAttrId?: number) => {
      const filters = Object.entries(selectedFilters);
      for (const [idStr, terms] of filters) {
        const id = Number(idStr);
        if (id === excludeAttrId) continue;
        const pAttr = p.attributes?.find((a: any) => a.id === id);
        if (!pAttr) return false;
        
        const matchingTerms = pAttr.options.some((o: string) => {
          const globalAttr = attributes.find(ga => ga.id === id);
          const tMatch = globalAttr?.terms.find((t: AttributeTerm) => t.name.trim().toLowerCase() === o.trim().toLowerCase());
          return tMatch && terms.has(tMatch.id);
        });
        if (!matchingTerms) return false;
      }
      if (afdichtingsspleetRange) {
        const pVan = p.attributes?.find((a: any)=>a.name==="Afdichtingsspleet Van")?.options.map((o:any)=>parseFloat(o)).filter((n:any)=>!isNaN(n));
        const pTot = p.attributes?.find((a: any)=>a.name==="Afdichtingsspleet Tot")?.options.map((o:any)=>parseFloat(o)).filter((n:any)=>!isNaN(n));
        const pMin = pVan && pVan.length > 0 ? Math.min(...pVan) : null;
        const pMax = pTot && pTot.length > 0 ? Math.max(...pTot) : null;
        if (pMin !== null && pMin > afdichtingsspleetRange[1]) return false;
        if (pMax !== null && pMax < afdichtingsspleetRange[0]) return false;
      }
      if (groefbreedteRange) {
        const pVan = p.attributes?.find((a: any)=>a.name==="Groefbreedte Van")?.options.map((o:any)=>parseFloat(o)).filter((n:any)=>!isNaN(n));
        const pTot = p.attributes?.find((a: any)=>a.name==="Groefbreedte Tot")?.options.map((o:any)=>parseFloat(o)).filter((n:any)=>!isNaN(n));
        const pMin = pVan && pVan.length > 0 ? Math.min(...pVan) : null;
        const pMax = pTot && pTot.length > 0 ? Math.max(...pTot) : null;
        if (pMin !== null && pMin > groefbreedteRange[1]) return false;
        if (pMax !== null && pMax < groefbreedteRange[0]) return false;
      }
      return true;
  };

  const relevantAttributes = useMemo(() => {
    const sourceProducts = allCategoryProductsForFilters || [];
    if (sourceProducts.length === 0) return [];
    
    const presentAttrIds = new Set<number>();
    sourceProducts.forEach(p => {
      p.attributes?.forEach((a: any) => {
        if (a.id) presentAttrIds.add(a.id);
      });
    });

    const activeGlobalAttrs = attributes.filter(ga => presentAttrIds.has(ga.id));

    return activeGlobalAttrs
      .map((attr) => {
        if (category?.acf) {
          let slug = attr.slug || (attr.name || "").toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/-+/g, '-');
          let acfKey = ATTRIBUTE_TO_ACF_MAP[slug] || slug.replace(/^pa_/, '').replace(/-/g, '_');
          if (acfKey && (category.acf[acfKey] === false || category.acf[acfKey] === "false")) return null;
        }
        if (attr.name === "Inhoud van de verpakking") return null;

        const productsPassingOtherFilters = sourceProducts.filter(p => checkGlobalMatchLocal(p, attr.id)); 

        const validTerms = attr.terms.map((term: AttributeTerm) => {
          let count = 0;
          const termNameLowercase = term.name.trim().toLowerCase();
          productsPassingOtherFilters.forEach(p => {
             const pAttr = p.attributes?.find((a: any) => a.id === attr.id);
             if (pAttr?.options.some((o: string) => o.trim().toLowerCase() === termNameLowercase)) {
                count++;
             }
          });
          const existsInCategory = sourceProducts.some(p => {
             const pAttr = p.attributes?.find((a: any) => a.id === attr.id);
             return pAttr?.options.some((o: string) => o.trim().toLowerCase() === termNameLowercase);
          });
          return existsInCategory ? { ...term, count } : null;
        }).filter(Boolean) as AttributeTerm[];

        if (validTerms.length === 0) return null;
        return { ...attr, terms: validTerms };
      })
      .filter(Boolean) as Attribute[];
  }, [allCategoryProductsForFilters, attributes, category, selectedFilters, afdichtingsspleetRange, groefbreedteRange]);

  const colorAttribute = relevantAttributes.find(
    (attr) => attr.name.toLowerCase() === "color" || attr.name.toLowerCase() === "kleur"
  );
  const otherAttributes = relevantAttributes.filter(
    (attr) => attr.name.toLowerCase() !== "color" && attr.name.toLowerCase() !== "kleur"
  );

  const afdichtVanAttr = otherAttributes.find(a => a.name === "Afdichtingsspleet Van");
  const afdichtTotAttr = otherAttributes.find(a => a.name === "Afdichtingsspleet Tot");

  const afdichtspleetBounds = useMemo(() => {
    if (!afdichtVanAttr && !afdichtTotAttr) return null;
    if (category?.acf?.afdichtingsspleet === false || category?.acf?.afdichtingsspleet === "false") return null;
    let min = Infinity, max = -Infinity;
    [afdichtVanAttr, afdichtTotAttr].forEach(attr => {
      attr?.terms.forEach(t => {
        const val = parseFloat(t.name);
        if (!isNaN(val)) { min = Math.min(min, val); max = Math.max(max, val); }
      });
    });
    return min === Infinity ? null : { min, max };
  }, [afdichtVanAttr, afdichtTotAttr, category]);

  const groefVanAttr = otherAttributes.find(a => a.name === "Groefbreedte Van");
  const groefTotAttr = otherAttributes.find(a => a.name === "Groefbreedte Tot");

  const groefbreedteBounds = useMemo(() => {
    if (!groefVanAttr && !groefTotAttr) return null;
    if (category?.acf?.groefbreedte === false || category?.acf?.groefbreedte === "false") return null;
    let min = Infinity, max = -Infinity;
    [groefVanAttr, groefTotAttr].forEach(attr => {
      attr?.terms.forEach(t => {
        const val = parseFloat(t.name);
        if (!isNaN(val)) { min = Math.min(min, val); max = Math.max(max, val); }
      });
    });
    return min === Infinity ? null : { min, max };
  }, [groefVanAttr, groefTotAttr, category]);

  const regularAttributes = otherAttributes.filter(a => !["Afdichtingsspleet Van", "Afdichtingsspleet Tot", "Groefbreedte Van", "Groefbreedte Tot"].includes(a.name));
  const validRegularAttributes = regularAttributes.filter(attr => attr.terms.length > 1);
  const hasValidColorAttribute = !!colorAttribute && colorAttribute.terms.length > 1;

  const [isColorOpen, setIsColorOpen] = useState(true);
  const [isAfdichtOpen, setIsAfdichtOpen] = useState(true);
  const [isGroefOpen, setIsGroefOpen] = useState(true);

  return (
    <aside className="w-full lg:w-1/4 relative">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => setShowFilters(false)} className={`${showFilters ? 'block' : 'hidden'} lg:hidden absolute top-3 right-3 text-gray-500`}>
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className={`${showFilters ? 'max-h-[2000px] opacity-100 p-4' : 'max-h-0 opacity-0 lg:p-4'} overflow-hidden transition-all lg:max-h-full lg:opacity-100 bg-white rounded-lg shadow-sm border border-gray-100`}>
          {hasValidColorAttribute && (
            <div className="mb-4 border-b border-[#F7F7F7] pb-4">
              <button 
                onClick={() => setIsColorOpen(!isColorOpen)}
                className="flex items-center justify-between w-full group py-2"
              >
                <h3 className="font-semibold text-lg text-[#212121] group-hover:text-[#0066FF] transition-colors">{colorAttribute?.name}</h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-gray-400 transition-transform duration-200 ${isColorOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {isColorOpen && colorAttribute && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-3"
                >
                  <div className="grid grid-cols-5 gap-4">
                    {(showAllColors ? colorAttribute.terms : colorAttribute.terms.slice(0, 5)).map(term => {
                      const isSelected = selectedFilters[colorAttribute.id]?.has(term.id);
                      return (
                        <div key={term.id} className={`flex flex-col items-center duration-300 ${term.count === 0 && !isSelected ? 'opacity-30' : ''}`}>
                          <button className={`w-8 h-8 rounded-full border-2 ${isSelected ? 'ring-2 ring-blue-500 scale-110' : 'border-gray-200'}`}
                            style={{ backgroundColor: COLOR_MAP[term.name.toLowerCase()] || term.name.toLowerCase() }}
                            onClick={() => toggleFilter(colorAttribute.id, term.id)} />
                        </div>
                      );
                    })}
                  </div>
                  {colorAttribute.terms.length > 5 && (
                    <button className="text-sm text-blue-600 mt-2 font-medium" onClick={() => setShowAllColors(!showAllColors)}>
                      {showAllColors ? "Toon minder" : `Toon meer (${colorAttribute.terms.length - 5})`}
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}
          {afdichtspleetBounds && (
            <div className="mb-4 border-b border-[#F7F7F7] pb-4">
               <button 
                onClick={() => setIsAfdichtOpen(!isAfdichtOpen)}
                className="flex items-center justify-between w-full group py-2"
              >
                <h3 className="font-semibold text-lg text-[#212121] group-hover:text-[#0066FF] transition-colors">Afdichtingsspleet (mm)</h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-gray-400 transition-transform duration-200 ${isAfdichtOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {isAfdichtOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-3 px-1"
                >
                  <DualRangeSlider 
                    min={afdichtspleetBounds.min} 
                    max={afdichtspleetBounds.max} 
                    value={afdichtingsspleetRange ?? [afdichtspleetBounds.min, afdichtspleetBounds.max]} 
                    onChange={setAfdichtingsspleetRange} 
                  />
                </motion.div>
              )}
            </div>
          )}
          {groefbreedteBounds && (
            <div className="mb-4 border-b border-[#F7F7F7] pb-4">
               <button 
                onClick={() => setIsGroefOpen(!isGroefOpen)}
                className="flex items-center justify-between w-full group py-2"
              >
                <h3 className="font-semibold text-lg text-[#212121] group-hover:text-[#0066FF] transition-colors">Groefbreedte (mm)</h3>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-gray-400 transition-transform duration-200 ${isGroefOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {isGroefOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-3 px-1"
                >
                  <DualRangeSlider 
                    min={groefbreedteBounds.min} 
                    max={groefbreedteBounds.max} 
                    value={groefbreedteRange ?? [groefbreedteBounds.min, groefbreedteBounds.max]} 
                    onChange={setGroefbreedteRange} 
                  />
                </motion.div>
              )}
            </div>
          )}

          {validRegularAttributes.map((attr: Attribute) => (
            <FilterAttributeGroup key={attr.id} attr={attr} selectedFilters={selectedFilters} toggleFilter={toggleFilter} />
          ))}
          {(Object.keys(selectedFilters).length > 0 || afdichtingsspleetRange || groefbreedteRange) && (
            <button onClick={resetFilters} className="text-sm text-red-500 hover:text-red-700 font-bold mt-4 block w-full text-center py-2 border border-red-100 rounded-md bg-red-50 transition-colors">Filters wissen</button>
          )}
        </div>
      </motion.div>
    </aside>
  );
}

export default function CategoryClient({

  category,
  subCategories,
  attributes,
  currentSlug,
  initialProducts = [],
  initialTotalPages = 1,
  initialTotalProducts = 0,
  initialFilterBaseProducts = [],
}: CategoryClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>(initialProducts);
  const [rawProducts, setRawProducts] = useState<any[]>(initialProducts);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: number]: Set<number> }>({});
  const [productsLoading, setProductsLoading] = useState<boolean>(false);
  const [filtersLoading, setFiltersLoading] = useState<boolean>(false);
  const [showAllColors, setShowAllColors] = useState(false);
  const [sortBy, setSortBy] = useState<string>(() => {
    return searchParams.get("sort") || "";
  });
  // const [activeSubCategories, setActiveSubCategories] = useState<Set<number>>(new Set()); // nested url change
  const [showFilters, setShowFilters] = useState(false);
  const [afdichtingsspleetRange, setAfdichtingsspleetRange] = useState<[number, number] | null>(null);
  const [groefbreedteRange, setGroefbreedteRange] = useState<[number, number] | null>(null);
  const [unwrappedAttributes, setUnwrappedAttributes] = useState<Attribute[]>([]);
  const [allCategoryProductsForFilters, setAllCategoryProductsForFilters] = useState<any[]>([]);
  const isInitialMount = useRef(true);

  useEffect(() => {
    Promise.resolve(attributes).then(res => setUnwrappedAttributes(res as Attribute[]));
    Promise.resolve(initialFilterBaseProducts).then(res => setAllCategoryProductsForFilters(res as any[]));
  }, [attributes, initialFilterBaseProducts]);

  
  // Initialize page from URL
  const [page, setPage] = useState<number>(() => {
    return parseInt(searchParams.get("page") || "1");
  });
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [totalProducts, setTotalProducts] = useState<number>(initialTotalProducts);

  // Sync state with URL when page or sort changes

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const currentPageStr = params.get("page") || "1";
    const currentSortStr = params.get("sort") || "";
    
    let changed = false;
    
    if (page.toString() !== currentPageStr) {
      if (page > 1) {
        params.set("page", page.toString());
      } else {
        params.delete("page");
      }
      changed = true;
    }

    if (sortBy !== currentSortStr) {
      if (sortBy) {
        params.set("sort", sortBy);
      } else {
        params.delete("sort");
      }
      changed = true;
    }
    
    if (changed) {
      const queryString = params.toString();
      const newPathname = window.location.pathname + (queryString ? "?" + queryString : "");
      router.replace(newPathname, { scroll: false });
    }
  }, [page, sortBy, router]);

  // ------------------------------------------------------------------
  // Filtering Logic
  // ------------------------------------------------------------------
  const checkGlobalMatch = (p: any, excludeAttrId?: number) => {
      // 1. Regular attributes - AND between groups, OR within group
      const filters = Object.entries(selectedFilters);
      for (const [idStr, terms] of filters) {
        const id = Number(idStr);
        if (id === excludeAttrId) continue;
        const pAttr = p.attributes?.find((a: any) => a.id === id);
        if (!pAttr) return false;
        
        const matchingTerms = pAttr.options.some((o: string) => {
          const globalAttr = unwrappedAttributes.find(ga => ga.id === id);
          const tMatch = globalAttr?.terms.find((t: AttributeTerm) => t.name.trim().toLowerCase() === o.trim().toLowerCase());
          return tMatch && terms.has(tMatch.id);
        });

        if (!matchingTerms) return false;
      }

      // 2. Ranges (Special logic for existing attributes)
      if (afdichtingsspleetRange) {
        const pVan = p.attributes?.find((a: any)=>a.name==="Afdichtingsspleet Van")?.options.map((o:any)=>parseFloat(o)).filter((n:any)=>!isNaN(n));
        const pTot = p.attributes?.find((a: any)=>a.name==="Afdichtingsspleet Tot")?.options.map((o:any)=>parseFloat(o)).filter((n:any)=>!isNaN(n));
        const vMin = pVan?.length ? Math.min(...pVan) : 0;
        const vMax = pTot?.length ? Math.max(...pTot) : 9999;
        if (!(vMin <= afdichtingsspleetRange[1] && vMax >= afdichtingsspleetRange[0])) return false;
      }
      if (groefbreedteRange) {
        const pVan = p.attributes?.find((a: any)=>a.name==="Groefbreedte Van")?.options.map((o:any)=>parseFloat(o)).filter((n:any)=>!isNaN(n));
        const pTot = p.attributes?.find((a: any)=>a.name==="Groefbreedte Tot")?.options.map((o:any)=>parseFloat(o)).filter((n:any)=>!isNaN(n));
        const vMin = pVan?.length ? Math.min(...pVan) : 0;
        const vMax = pTot?.length ? Math.max(...pTot) : 9999;
        if (!(vMin <= groefbreedteRange[1] && vMax >= groefbreedteRange[0])) return false;
      }
      return true;
  };

  useEffect(() => {
    async function loadProducts() {
      if (!category) return;

      const hasFilters = Object.keys(selectedFilters).length > 0 || !!afdichtingsspleetRange || !!groefbreedteRange;

      // Logic: 
      // 1. If we have NO filters AND NO custom sorting, we can use the server-side pre-fetched initialProducts for Page 1.
      if (isInitialMount.current) {
         if (!hasFilters && !sortBy && page === 1) {
            setProducts(initialProducts);
            setRawProducts(initialProducts);
            setTotalPages(initialTotalPages);
            setTotalProducts(initialTotalProducts);
            isInitialMount.current = false;
            return;
         }
         isInitialMount.current = false;
      }
      
      setProductsLoading(true);

      try {
        // Optimization: If we have filters active, we MUST use our local client-side Filter Base (full product list)
        // to handle complex multi-select filtering and faceted counts correctly.
        if (hasFilters) {
           // We need to wait until the full category products are loaded for filtering to work accurately across pages
           if (allCategoryProductsForFilters.length === 0) {
              // Wait for it to load via the other useEffect or promise resolution
              return; 
           }

           let matches = allCategoryProductsForFilters.filter(p => checkGlobalMatch(p));
           
           // Sort matches locally if needed
           if (sortBy) {
              matches.sort((a,b) => {
                 if (sortBy === 'price-low-high') return parseFloat(a.price || "0") - parseFloat(b.price || "0");
                 if (sortBy === 'price-high-low') return parseFloat(b.price || "0") - parseFloat(a.price || "0");
                 if (sortBy === 'title-asc') return (a.name || "").localeCompare(b.name || "");
                 if (sortBy === 'title-desc') return (b.name || "").localeCompare(a.name || "");
                 if (sortBy === 'date') return new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime();
                 if (sortBy === 'popularity') return (b.total_sales || 0) - (a.total_sales || 0);
                 return 0;
              });
           }

           const sliced = matches.slice((page - 1) * 20, page * 20);
           const slicedIds = sliced.map(m => m.id);

           if (slicedIds.length === 0) {
              setProducts([]);
              setTotalProducts(matches.length);
              setTotalPages(Math.ceil(matches.length / 20));
           } else {
              // Fetch full product details for just this page's matched IDs
              const res = await fetch(`/api/products?include=${slicedIds.join(',')}`);
              const data = await res.json();
              
              // Ensure order is preserved as per our local sort
              const sortedData = slicedIds.map(id => data.find((p:any) => p.id === id)).filter(Boolean);
              setProducts(sortedData);
              setTotalProducts(matches.length);
              setTotalPages(Math.ceil(matches.length / 20));
           }

        } else {
           // Standard paginated fetch (No filters applied: Sorting can be handled by API)
           const params: any = { per_page: 20, page: page, category: category.id };
           
           if (sortBy) {
              switch(sortBy) {
                case 'price-low-high': params.orderby = 'price'; params.order = 'asc'; break;
                case 'price-high-low': params.orderby = 'price'; params.order = 'desc'; break;
                case 'title-asc': params.orderby = 'title'; params.order = 'asc'; break;
                case 'title-desc': params.orderby = 'title'; params.order = 'desc'; break;
                case 'date': params.orderby = 'date'; params.order = 'desc'; break;
                case 'popularity': params.orderby = 'popularity'; params.order = 'desc'; break;
                case 'rating': params.orderby = 'rating'; params.order = 'desc'; break;
              }
           }

           const queryString = new URLSearchParams(params as any).toString();
           const res = await fetch(`/api/products?${queryString}`, { cache: 'no-store' });
           if (!res.ok) throw new Error('Failed to fetch products');
           
           const totalPagesHeader = res.headers.get('x-wp-totalpages');
           const totalItemsHeader = res.headers.get('x-wp-total');
           const data = await res.json();
           
           setProducts(data);
           setRawProducts(data);
           if (totalPagesHeader) setTotalPages(parseInt(totalPagesHeader));
           if (totalItemsHeader) setTotalProducts(parseInt(totalItemsHeader));
        }
      } catch (err) {
        console.error("LoadProducts error:", err);
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, [category?.id, selectedFilters, afdichtingsspleetRange, groefbreedteRange, sortBy, page, allCategoryProductsForFilters]);

  // Reset page when category OR filters OR sorting changes
  useEffect(() => {
    // Only reset if it's NOT the initial load
    // We want to reset page to 1 if the USER changes the category, filters, or sorting.
    // We use a flag to skip the initial mount reset.
    if (isInitialMount.current) return;
    
    // We should NOT reset if the only change was 'page' itself.
    // This effect only runs when catId, filters or sortBy change.
    setPage(1);
  }, [category?.id, selectedFilters, afdichtingsspleetRange, groefbreedteRange, sortBy]);

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

  const resetFilters = () => {
    setSelectedFilters({});
    setAfdichtingsspleetRange(null);
    setGroefbreedteRange(null);
  };

  // Relevant attributes moved to FilterSidebar component for streaming support


  // Filter validation state moved to FilterSidebar


  return (
    <div className="bg-[#F7F7F7] min-h-screen">
      <div className="max-w-[1440px] mx-auto py-4 lg:py-8 px-5 lg:px-0">
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-8">
          
          <Suspense fallback={<div className="w-full lg:w-1/4 animate-pulse bg-white rounded-lg h-[600px]"></div>}>
            <FilterSidebar 
              attributes={attributes}
              initialFilterBaseProducts={initialFilterBaseProducts}
              category={category}
              selectedFilters={selectedFilters}
              toggleFilter={toggleFilter}
              resetFilters={resetFilters}
              afdichtingsspleetRange={afdichtingsspleetRange}
              groefbreedteRange={groefbreedteRange}
              setAfdichtingsspleetRange={setAfdichtingsspleetRange}
              setGroefbreedteRange={setGroefbreedteRange}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
            />
          </Suspense>


          {/* Main Content */}
          <main className="flex-1">
            <CategoryBreadcrumbs categoryNames={currentSlug.map(s => s.charAt(0).toUpperCase() + s.slice(1))} />
            <div className="flex justify-between items-end mb-4 sticky top-[88px] bg-[#F7F7F7] z-40 py-4 -mx-5 px-5 lg:static lg:p-0 lg:mx-0"> 
              <p className="text-xl lg:text-3xl font-bold">{category?.name ?? "Category"}</p>
              <div className='flex gap-3 '>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select focus:outline-0 focus:ring-0 w-32 border border-[#808D9A] rounded-sm bg-[F7F7F7] h-8 w-full">
                  <option value="">Aanbevolen</option>
                  <option value="popularity">Populariteit</option>
                  <option value="rating">Beoordeling</option>
                  <option value="date">Nieuwste</option>
                  <option value="price-low-high">Prijs: Laag naar Hoog</option>
                  <option value="price-high-low">Prijs: Hoog naar Laag</option>
                  <option value="title-asc">Naam: A - Z</option>
                  <option value="title-desc">Naam: Z - A</option>
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

            <Suspense fallback={<div className="h-10 w-full animate-pulse bg-gray-100 rounded mb-4"></div>}>
              <SubCategoryGrid subCategories={subCategories} currentSlug={currentSlug} />
            </Suspense>


            {/* Products Grid */}
            {productsLoading ? (
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