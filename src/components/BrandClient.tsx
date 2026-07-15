"use client";

import { useEffect, useState, useMemo, useRef, use, Suspense } from "react";

import api from "@/lib/woocommerce";
import ShopProductCard from "@/components/ShopProductCard";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

import DualRangeSlider from "@/components/DualRangeSlider";
import { COLOR_MAP } from "@/config/colorMap";
import { useUserContext } from "@/context/UserContext";
import { getDutchFilterTitle } from "@/lib/dutchTranslations";

export const getFinalPrice = (product: any, isB2B: boolean) => {
  const getMeta = (k: string) => product?.meta_data?.find((m: any) => m.key === k)?.value;
  const taxRate = 21;
  const taxMultiplier = 1 + (taxRate / 100);

  let sale = 0;

  if (isB2B) {
    const b2bPrice = product.price_b2b;
    if (b2bPrice && typeof b2bPrice === 'object' && b2bPrice.amount) {
      sale = parseFloat(b2bPrice.amount);
    } else if (b2bPrice && !isNaN(parseFloat(b2bPrice))) {
      sale = parseFloat(b2bPrice);
    } else if (product.price) {
      sale = parseFloat(product.price);
    }
  } else {
    const b2cPrice = product.price_b2c;
    if (b2cPrice && typeof b2cPrice === 'object' && b2cPrice.amount) {
      sale = parseFloat(b2cPrice.amount);
    } else if (b2cPrice && !isNaN(parseFloat(b2cPrice))) {
      sale = parseFloat(b2cPrice);
    } else if (product.price) {
      sale = parseFloat(product.price);
    }
  }

  return isB2B ? sale : (sale ? sale * taxMultiplier : 0);
};

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

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PURE FILTER UTILITY
// Used identically by FilterSidebar (facet counts) and CategoryClient
// (product loading). Keeping one copy prevents logic drift.
// ─────────────────────────────────────────────────────────────────────────────
function matchesFilters(
  product: any,
  selectedFilters: { [key: number]: Set<number> },
  selectedBrands: Set<number>,
  allAttributes: Attribute[],
  afdichtingsspleetRange: [number, number] | null,
  groefbreedteRange: [number, number] | null,
  showOnlyInStock: boolean,
  priceRange: [number, number] | null,
  isB2B: boolean,
  excludeAttrId?: number,
  excludeBrand?: boolean
): boolean {
  // 0. Stock filter
  if (showOnlyInStock) {
    const qty = product.stock_quantity;
    if (qty !== null && qty <= 0) return false;
    if (qty === null && product.stock_status !== 'instock') return false;
  }

  // 1. Brand filter
  if (!excludeBrand && selectedBrands.size > 0) {
    if (!product.brands || product.brands.length === 0) return false;
    const hasBrandMatch = product.brands.some((b: any) => selectedBrands.has(Number(b.id)));
    if (!hasBrandMatch) return false;
  }

  // 2. Regular attribute filters — AND across groups, OR within each group
  for (const [idStr, terms] of Object.entries(selectedFilters)) {
    const id = Number(idStr);
    if (id === excludeAttrId) continue;
    const pAttr = product.attributes?.find((a: any) => a.id === id);
    if (!pAttr) {
      console.log(`[matchesFilters] Product ${product.name} missing attribute ${id}`);
      return false;
    }
    const hasMatch = pAttr.options.some((o: string) => {
      const globalAttr = allAttributes.find(ga => ga.id === id);
      const tMatch = globalAttr?.terms.find(
        (t: AttributeTerm) => t.name.trim().toLowerCase() === o.trim().toLowerCase()
      );
      if (!tMatch) console.log(`[matchesFilters] No term match for option "${o}" in attr ${id}`);
      return tMatch && terms.has(tMatch.id);
    });
    if (!hasMatch) {
      console.log(`[matchesFilters] Product ${product.name} failed filter ${id}. Options:`, pAttr.options, 'Selected terms:', Array.from(terms));
      return false;
    }
  }

  // 3. Range: Afdichtingsspleet
  if (afdichtingsspleetRange) {
    const pVan = (product.attributes?.find((a: any) => a.name === "Afdichtingsspleet Van")?.options ?? [])
      .map((o: any) => parseFloat(o)).filter((n: number) => !isNaN(n));
    const pTot = (product.attributes?.find((a: any) => a.name === "Afdichtingsspleet Tot")?.options ?? [])
      .map((o: any) => parseFloat(o)).filter((n: number) => !isNaN(n));
    const pMin = pVan.length > 0 ? Math.min(...pVan) : null;
    const pMax = pTot.length > 0 ? Math.max(...pTot) : null;
    if (pMin === null && pMax === null) return false;
    const vMin = pMin !== null ? pMin : 0;
    const vMax = pMax !== null ? pMax : 9999;
    if (!(vMin <= afdichtingsspleetRange[1] && vMax >= afdichtingsspleetRange[0])) return false;
  }

  // 4. Range: Groefbreedte
  if (groefbreedteRange) {
    const pVan = (product.attributes?.find((a: any) => a.name === "Groefbreedte Van")?.options ?? [])
      .map((o: any) => parseFloat(o)).filter((n: number) => !isNaN(n));
    const pTot = (product.attributes?.find((a: any) => a.name === "Groefbreedte Tot")?.options ?? [])
      .map((o: any) => parseFloat(o)).filter((n: number) => !isNaN(n));
    const pMin = pVan.length > 0 ? Math.min(...pVan) : null;
    const pMax = pTot.length > 0 ? Math.max(...pTot) : null;
    if (pMin === null && pMax === null) return false;
    const vMin = pMin !== null ? pMin : 0;
    const vMax = pMax !== null ? pMax : 9999;
    if (!(vMin <= groefbreedteRange[1] && vMax >= groefbreedteRange[0])) return false;
  }

  // 5. Range: Price
  if (priceRange) {
    const productPrice = getFinalPrice(product, isB2B);
    if (productPrice > 0) {
      if (productPrice < priceRange[0] || productPrice > priceRange[1]) return false;
    } else {
      return false; // hide invalid prices when filtering by price
    }
  }

  return true;
}

type BrandClientProps = {
  brand: any;
  category?: any;
  categorySlug?: string;
  subCategories: any[] | Promise<any[]>;
  currentSlug: string[];
  initialProducts?: any[];
  initialTotalPages?: number;
  initialTotalProducts?: number;
  allAttributes?: Attribute[];
  children?: React.ReactNode;
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
        <h3 className="font-semibold text-lg text-[#212121] capitalize group-hover:text-[#0050D1] transition-colors">{getDutchFilterTitle(attr.name)}</h3>
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
            const isDisabled = term.count === 0 && !isSelected;
            return (
              <label key={term.id} className={`flex items-start gap-1 transition-opacity ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}>
                <div className="w-5">
                  <input
                    type="checkbox"
                    className={`mr-2 w-5 h-5 rounded-sm border border-gray-300 text-[#0050D1] focus:ring-0 focus:ring-offset-0 ${isDisabled ? 'cursor-not-allowed' : ''}`}
                    checked={isSelected}
                    disabled={isDisabled}
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

function FilterSidebarSkeleton() {
  const shimmer = "bg-gradient-to-r from-gray-200 via-gray-50 to-gray-200 bg-[length:400%_100%] animate-[shimmer_1.6s_ease-in-out_infinite]";
  return (
    <aside className="w-full lg:w-1/4">
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        {[
          { title: 0.4, items: [0.7, 0.55, 0.8] },
          { title: 0.35, items: [0.6, 0.75, 0.5, 0.65, 0.8] },
          { title: 0.45, items: [0.7, 0.6, 0.5] },
          { title: 0.38, items: [0.55, 0.7, 0.65, 0.6] },
        ].map((group, gi) => (
          <div key={gi} className={`mb-5 pb-5 ${gi < 3 ? "border-b border-gray-100" : ""}`}>
            <div className={`h-5 rounded mb-4 ${shimmer}`} style={{ width: `${group.title * 100}%`, animationDelay: `${gi * 0.1}s` }} />
            {group.items.map((w, ii) => (
              <div key={ii} className="flex items-center gap-3 mb-3">
                <div className={`w-5 h-5 rounded-sm flex-shrink-0 ${shimmer}`} style={{ animationDelay: `${(gi * 3 + ii) * 0.06}s` }} />
                <div className={`h-3.5 rounded ${shimmer}`} style={{ width: `${w * 100}%`, animationDelay: `${(gi * 3 + ii) * 0.06}s` }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

interface FilterSidebarProps {
  attributes: Attribute[];
  allCategoryProductsForFilters: any[];
  category: any;
  selectedFilters: { [key: number]: Set<number> };
  selectedBrands: Set<number>;
  toggleFilter: (attrId: number, termId: number) => void;
  toggleBrandFilter: (brandId: number) => void;
  resetFilters: () => void;
  afdichtingsspleetRange: [number, number] | null;
  groefbreedteRange: [number, number] | null;
  setAfdichtingsspleetRange: (r: [number, number] | null) => void;
  setGroefbreedteRange: (r: [number, number] | null) => void;
  showFilters: boolean;
  setShowFilters: (s: boolean) => void;
  showOnlyInStock: boolean;
  setShowOnlyInStock: (s: boolean) => void;
  priceRange: [number, number] | null;
  setPriceRange: (r: [number, number] | null) => void;
  onFilterCheck?: (hasFilters: boolean) => void;
  isB2B: boolean;
}

function FilterSidebar({
  attributes,
  allCategoryProductsForFilters,
  category,
  selectedFilters,
  selectedBrands,
  toggleFilter,
  toggleBrandFilter,
  resetFilters,
  afdichtingsspleetRange,
  groefbreedteRange,
  setAfdichtingsspleetRange,
  setGroefbreedteRange,
  showFilters,
  setShowFilters,
  showOnlyInStock,
  setShowOnlyInStock,
  priceRange,
  setPriceRange,
  onFilterCheck,
  isB2B
}: FilterSidebarProps) {

  const [showAllColors, setShowAllColors] = useState(false);
  const [isBrandOpen, setIsBrandOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  /**
   * Helper that reads a filter flag from either:
   *  1. Empire category flags (has_brands, has_colors, …)  ← preferred
   *  2. WooCommerce ACF object (legacy fallback)
   * Returns true when the flag is enabled (or when it is simply absent/undefined).
   */
  const getCategoryFlag = (empireKey: string, acfKey?: string): boolean => {
    // 1. Empire flag (e.g. category.has_brands)
    if (category && empireKey in category) {
      return Boolean(category[empireKey]);
    }
    // 2. WooCommerce ACF fallback
    const key = acfKey || empireKey.replace(/^has_/, '');
    if (category?.acf && typeof category.acf === 'object' && key in category.acf) {
      const val = category.acf[key];
      return val !== false && val !== 'false' && val !== 0 && val !== '0';
    }
    return true; // default: show the filter
  };

  const isBrandsEnabled = getCategoryFlag('has_brands', 'brands');
  const isInStockEnabled = getCategoryFlag('has_in_stock', 'in_stock');
  const isPriceSliderEnabled = getCategoryFlag('price_slider', 'price_slider');


  // Use the shared matchesFilters utility for facet count calculations
  const checkGlobalMatchLocal = (p: any, excludeAttrId?: number, excludeBrand?: boolean) =>
    matchesFilters(p, selectedFilters, selectedBrands, attributes, afdichtingsspleetRange, groefbreedteRange, showOnlyInStock, priceRange, isB2B, excludeAttrId, excludeBrand);

  const availableBrands = useMemo(() => {
    const sourceProducts = allCategoryProductsForFilters || [];
    if (sourceProducts.length === 0) return [];

    const brandCounts = new Map<number, { name: string; count: number }>();
    const productsPassingOtherFilters = sourceProducts.filter(p => checkGlobalMatchLocal(p, undefined, true));

    productsPassingOtherFilters.forEach(p => {
      if (p.brands && p.brands.length > 0) {
        p.brands.forEach((b: any) => {
          const id = Number(b.id);
          if (!brandCounts.has(id)) {
            brandCounts.set(id, { name: b.name, count: 0 });
          }
          brandCounts.get(id)!.count++;
        });
      }
    });
    const brandsArray = Array.from(brandCounts.entries())
      .map(([id, data]) => ({ id, name: data.name, count: data.count }))
      .filter(b => b.count > 0 || selectedBrands.has(b.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (brandsArray.length <= 1 && selectedBrands.size === 0) {
      return [];
    }

    console.log(`[FilterSidebar] availableBrands:`, brandsArray);
    return brandsArray;
  }, [allCategoryProductsForFilters, selectedFilters, selectedBrands, attributes, afdichtingsspleetRange, groefbreedteRange, showOnlyInStock]);

  const relevantAttributes = useMemo(() => {
    const sourceProducts = allCategoryProductsForFilters || [];
    if (sourceProducts.length === 0) return [];
    
    // O(P): Pre-calculate overall presence of attr/term pairs in the entire category
    const globalTermPresence = new Map<number, Set<string>>();
    sourceProducts.forEach(p => {
      p.attributes?.forEach((a: any) => {
        if (a.id) {
          if (!globalTermPresence.has(a.id)) globalTermPresence.set(a.id, new Set());
          const termSet = globalTermPresence.get(a.id)!;
          a.options?.forEach((o: string) => termSet.add(o.trim().toLowerCase()));
        }
      });
    });

    const activeGlobalAttrs = attributes.filter(ga => globalTermPresence.has(ga.id));

    const result = activeGlobalAttrs
      .map((attr) => {
        // The 'attributes' array passed to FilterSidebar is already pre-filtered 
        // by the backend API route based on the Empire 'has_*' flags. 
        // We no longer need to perform complex slug-matching against brand.acf here.
        if (attr.name === "Inhoud van de verpakking") return null;

        // Get subset of products passing OTHER filters
        const productsPassingOtherFilters = sourceProducts.filter(p => checkGlobalMatchLocal(p, attr.id)); 

        // O(P): Pre-count occurrences for the specific attribute in the filtered subset
        const termCounts = new Map<string, number>();
        productsPassingOtherFilters.forEach(p => {
             const pAttr = p.attributes?.find((a: any) => a.id === attr.id);
             if (pAttr) {
                 const seenInProduct = new Set<string>();
                 pAttr.options?.forEach((o: string) => {
                     const key = o.trim().toLowerCase();
                     if (!seenInProduct.has(key)) {
                         seenInProduct.add(key);
                         termCounts.set(key, (termCounts.get(key) || 0) + 1);
                     }
                 });
             }
        });

        const categoryTerms = globalTermPresence.get(attr.id) || new Set();

        const validTerms = attr.terms.map((term: AttributeTerm) => {
          const termNameLowercase = term.name.trim().toLowerCase();
          
          // O(1): Fast lookup
          if (!categoryTerms.has(termNameLowercase)) return null;
          
          const count = termCounts.get(termNameLowercase) || 0;

          // Hide disabled filters (count 0) unless they are currently selected
          const isSelected = selectedFilters[attr.id]?.has(term.id) || false;
          if (count === 0 && !isSelected) return null;

          return { ...term, count };
        }).filter(Boolean) as AttributeTerm[];

        if (validTerms.length <= 1) {
            const isAnySelected = selectedFilters[attr.id] && selectedFilters[attr.id].size > 0;
            if (!isAnySelected) {
               return null;
            }
        }

        if (validTerms.length === 0) return null;
        return { ...attr, terms: validTerms };
      })
      .filter(Boolean) as Attribute[];
      
    console.log("---- FILTER DEBUG END ----");
    return result;
  }, [allCategoryProductsForFilters, attributes, category, selectedFilters, selectedBrands, afdichtingsspleetRange, groefbreedteRange]);

  const colorAttribute = relevantAttributes.find(
    (attr) => attr.name.toLowerCase() === "color" || attr.name.toLowerCase() === "kleur"
  );
  const otherAttributes = relevantAttributes.filter(
    (attr) => attr.name.toLowerCase() !== "color" && attr.name.toLowerCase() !== "kleur"
  );

  const afdichtVanAttr = otherAttributes.find(a => a.name === "Afdichtingsspleet Van");
  const afdichtTotAttr = otherAttributes.find(a => a.name === "Afdichtingsspleet Tot");

  const afdichtspleetBounds = useMemo(() => {
    const isEnabled = getCategoryFlag('has_afdichtingsspleet', 'afdichtingsspleet');
    if (!isEnabled) return null;
    if (!allCategoryProductsForFilters || allCategoryProductsForFilters.length === 0) return null;

    let min = Infinity, max = -Infinity;
    allCategoryProductsForFilters.forEach(p => {
      ["Afdichtingsspleet Van", "Afdichtingsspleet Tot"].forEach(attrName => {
        const attr = p.attributes?.find((a: any) => a.name === attrName);
        if (attr && attr.options) {
          attr.options.forEach((o: any) => {
            const val = parseFloat(o);
            if (!isNaN(val)) { min = Math.min(min, val); max = Math.max(max, val); }
          });
        }
      });
    });
    return min === Infinity ? null : { min, max };
  }, [allCategoryProductsForFilters, category]);

  const groefbreedteBounds = useMemo(() => {
    const isEnabled = getCategoryFlag('has_groefbreedte', 'groefbreedte');
    if (!isEnabled) return null;
    if (!allCategoryProductsForFilters || allCategoryProductsForFilters.length === 0) return null;

    let min = Infinity, max = -Infinity;
    allCategoryProductsForFilters.forEach(p => {
      ["Groefbreedte Van", "Groefbreedte Tot"].forEach(attrName => {
        const attr = p.attributes?.find((a: any) => a.name === attrName);
        if (attr && attr.options) {
          attr.options.forEach((o: any) => {
            const val = parseFloat(o);
            if (!isNaN(val)) { min = Math.min(min, val); max = Math.max(max, val); }
          });
        }
      });
    });
    return min === Infinity ? null : { min, max };
  }, [allCategoryProductsForFilters, category]);

  const priceBounds = useMemo(() => {
    if (!isPriceSliderEnabled) return null;
    if (!allCategoryProductsForFilters || allCategoryProductsForFilters.length === 0) return null;

    let min = Infinity, max = -Infinity;
    allCategoryProductsForFilters.forEach(p => {
      const price = getFinalPrice(p, isB2B);
      if (price > 0) {
        min = Math.min(min, price);
        max = Math.max(max, price);
      }
    });
    
    // If min and max are the same, don't show the slider
    if (min === Infinity || min === max) return null;
    
    return { min, max };
  }, [allCategoryProductsForFilters, isPriceSliderEnabled]);

  const regularAttributes = otherAttributes.filter(a => !["Afdichtingsspleet Van", "Afdichtingsspleet Tot", "Groefbreedte Van", "Groefbreedte Tot"].includes(a.name));
  const validRegularAttributes = regularAttributes.filter(attr => attr.terms.length > 0);
  const hasValidColorAttribute = !!colorAttribute && colorAttribute.terms.length > 0;

  const sortedColorTerms = useMemo(() => {
    if (!colorAttribute || !colorAttribute.terms) return [];
    
    const getLuminance = (hex: string) => {
      if (!hex.startsWith('#')) return 0;
      hex = hex.replace(/^#/, '');
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      if (hex.length !== 6) return 0;
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return 0.299 * r + 0.587 * g + 0.114 * b;
    };

    return [...colorAttribute.terms].sort((a, b) => {
      const colorA = COLOR_MAP[a.name.toLowerCase()] || a.name.toLowerCase();
      const colorB = COLOR_MAP[b.name.toLowerCase()] || b.name.toLowerCase();
      
      const lumA = colorA.startsWith('#') ? getLuminance(colorA) : 0;
      const lumB = colorB.startsWith('#') ? getLuminance(colorB) : 0;
      
      return lumB - lumA; // Higher luminance (light) to lower (dark)
    });
  }, [colorAttribute]);

  const [isColorOpen, setIsColorOpen] = useState(true);
  const [isAfdichtOpen, setIsAfdichtOpen] = useState(true);
  const [isGroefOpen, setIsGroefOpen] = useState(true);

  const hasAnyFilters = hasValidColorAttribute || validRegularAttributes.length > 0 || afdichtspleetBounds !== null || groefbreedteBounds !== null || priceBounds !== null || true; // Always show if we want to show stock filter

  useEffect(() => {
    if (onFilterCheck) onFilterCheck(hasAnyFilters);
  }, [hasAnyFilters, onFilterCheck]);



  if (!hasAnyFilters) return null;

  return (
    <aside className="w-full lg:w-1/4 relative">
      <div className={`
        ${showFilters ? 'fixed inset-0 z-[100] bg-white overflow-y-auto p-5 pt-16 block' : 'hidden'} 
        lg:block lg:relative lg:max-h-full lg:opacity-100 lg:bg-white lg:rounded-lg lg:shadow-sm lg:border lg:border-gray-100 lg:p-4 lg:z-auto lg:overflow-visible transition-all
      `}>
        <button onClick={() => setShowFilters(false)} className={`${showFilters ? 'flex' : 'hidden'} lg:hidden absolute top-4 right-4 text-gray-500 z-[101] p-2 bg-gray-100 rounded-full items-center justify-center`}>
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {showFilters && <h2 className="text-2xl font-bold mb-6 lg:hidden">Filters</h2>}

        {/* TEMPORARY DEBUG VISUAL */}
        {/* <div className="bg-red-100 text-red-800 p-2 text-xs mb-4 rounded">
          <b>Brand Debug:</b><br/>
          isBrandsEnabled: {String(isBrandsEnabled)}<br/>
          acf.brands: {String(brand?.acf?.brands)}<br/>
          sourceProducts (allCategoryProductsForFilters): {allCategoryProductsForFilters.length}<br/>
          products with 'brands' field: {allCategoryProductsForFilters.filter(p => p.brands && p.brands.length > 0).length}<br/>
          availableBrands.length: {availableBrands.length}<br/>
          brands: {availableBrands.map(b => b.name).join(', ')}
        </div> */}

        {isBrandsEnabled && availableBrands.length > 0 && (
          <div className="mb-4 border-b border-[#F7F7F7] pb-4">
            <button 
              onClick={() => setIsBrandOpen(!isBrandOpen)}
              className="flex items-center justify-between w-full group py-2"
            >
              <h3 className="font-semibold text-lg text-[#212121] group-hover:text-[#0050D1] transition-colors">Merk</h3>
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
                className={`text-gray-400 transition-transform duration-200 ${isBrandOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isBrandOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-3 flex flex-col gap-2 overflow-hidden"
              >
                {availableBrands.map(b => (
                  <label key={b.id} className="flex items-center gap-2 cursor-pointer py-1 group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-sm border-gray-300 text-[#0050D1] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      checked={selectedBrands.has(b.id)}
                      onChange={() => toggleBrandFilter(b.id)}
                      disabled={b.count === 0 && !selectedBrands.has(b.id)}
                    />
                    <span className={`text-sm group-hover:text-[#0050D1] transition-colors ${b.count === 0 && !selectedBrands.has(b.id) ? 'text-gray-400' : 'text-gray-700'}`}>
                      {b.name} <span className="text-gray-400 text-xs ml-1">({b.count})</span>
                    </span>
                  </label>
                ))}
              </motion.div>
            )}
          </div>
        )}
        {hasValidColorAttribute && (
          <div className="mb-4 border-b border-[#F7F7F7] pb-4">
            <button 
              onClick={() => setIsColorOpen(!isColorOpen)}
              className="flex items-center justify-between w-full group py-2"
            >
              <h3 className="font-semibold text-lg text-[#212121] group-hover:text-[#0050D1] transition-colors">{getDutchFilterTitle(colorAttribute?.name)}</h3>
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
                <div className="flex flex-wrap gap-2.5">
                  {(showAllColors ? sortedColorTerms : sortedColorTerms.slice(0, 10)).map(term => {
                    const isSelected = selectedFilters[colorAttribute.id]?.has(term.id);
                    const isDisabled = term.count === 0 && !isSelected;
                    return (
                      <div key={term.id} className={`relative group flex items-center justify-center duration-300 ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
                        <button className={`w-7 h-7 rounded-full border-2 ${isSelected ? 'ring-2 ring-blue-500 scale-110' : 'border-gray-200'} ${isDisabled ? 'cursor-not-allowed' : ''} shadow-sm`}
                          disabled={isDisabled}
                          aria-label={term.name}
                          style={{ backgroundColor: COLOR_MAP[term.name.toLowerCase()] || term.name.toLowerCase() }}
                          onClick={() => toggleFilter(colorAttribute.id, term.id)} />
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-sm">
                          {term.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {sortedColorTerms.length > 10 && (
                  <button className="text-sm text-blue-600 mt-2 font-medium" onClick={() => setShowAllColors(!showAllColors)}>
                    {showAllColors ? "Toon minder" : `Toon meer (${sortedColorTerms.length - 10})`}
                  </button>
                )}
              </motion.div>
            )}
          </div>
        )}

        {priceBounds && (
          <div className="mb-4 border-b border-[#F7F7F7] pb-4">
             <button 
              onClick={() => setIsPriceOpen(!isPriceOpen)}
              className="flex items-center justify-between w-full group py-2"
            >
              <h3 className="font-semibold text-lg text-[#212121] group-hover:text-[#0050D1] transition-colors">Prijs (€)</h3>
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
                className={`text-gray-400 transition-transform duration-200 ${isPriceOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isPriceOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-3 px-1"
              >
                <DualRangeSlider 
                  min={priceBounds.min} 
                  max={priceBounds.max} 
                  value={priceRange ?? [priceBounds.min, priceBounds.max]} 
                  onChange={setPriceRange} 
                />
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
              <h3 className="font-semibold text-lg text-[#212121] group-hover:text-[#0050D1] transition-colors">Afdichtingsspleet (mm)</h3>
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
              <h3 className="font-semibold text-lg text-[#212121] group-hover:text-[#0050D1] transition-colors">Groefbreedte (mm)</h3>
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

        {isInStockEnabled && (
          <div className="mb-4 pt-4 border-t border-[#F7F7F7] pb-4">
            <h3 className="font-semibold text-lg text-[#212121] py-2">Voorraad</h3>
            <label className="flex items-center gap-2 cursor-pointer py-1 group">
              <input
                type="checkbox"
                className="w-5 h-5 rounded-sm border-gray-300 text-[#0050D1] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                checked={showOnlyInStock}
                onChange={(e) => setShowOnlyInStock(e.target.checked)}
              />
              <span className="text-sm text-gray-700 group-hover:text-[#0050D1] transition-colors">Alleen op voorraad</span>
            </label>
          </div>
        )}

        {(Object.keys(selectedFilters).length > 0 || selectedBrands.size > 0 || afdichtingsspleetRange || groefbreedteRange || priceRange || showOnlyInStock) && (
          <button onClick={() => {
            resetFilters();
            setShowOnlyInStock(false);
          }} className="text-sm text-red-500 hover:text-red-700 font-bold mt-4 block w-full text-center py-2 border border-red-100 rounded-md bg-red-50 transition-colors">Filters wissen</button>
        )}
      </div>
    </aside>
  );
}

export default function BrandClient({ brand, category, subCategories, currentSlug, categorySlug, initialProducts = [], initialTotalPages = 1, initialTotalProducts = initialProducts.length, allAttributes = [], children }: BrandClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { userRole, isB2B } = useUserContext();
  

  const [products, setProducts] = useState<any[]>(initialProducts);
  const [rawProducts, setRawProducts] = useState<any[]>(initialProducts);
  const [selectedFilters, setSelectedFilters] = useState<{ [key: number]: Set<number> }>({});
  const [selectedBrands, setSelectedBrands] = useState<Set<number>>(new Set());
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
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [showOnlyInStock, setShowOnlyInStock] = useState<boolean>(false);
  const [hasFiltersAvailable, setHasFiltersAvailable] = useState<boolean>(true);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsStuck(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [unwrappedAttributes, setUnwrappedAttributes] = useState<Attribute[]>([]);
  const [allCategoryProductsForFilters, setAllCategoryProductsForFilters] = useState<any[]>([]);
  const [freshCategory, setFreshCategory] = useState<any>(category); // starts with server value, updates client-side
  const [filterDataLoading, setFilterDataLoading] = useState<boolean>(true);
  // Two separate refs: one guards the initial product load, one guards the page-reset effect.
  const isFirstProductLoad = useRef(true);
  const isFirstPageReset = useRef(true);

  // Fetch filter data client-side on every mount so WooCommerce/ACF changes
  // are reflected immediately — bypasses the Next.js Router Cache entirely.
  useEffect(() => {
    if (!brand?.id) return;
    setFilterDataLoading(true);
    const slugParam = brand.slug ? `&categorySlug=${encodeURIComponent(brand.slug)}` : '';
    fetch(`/api/category-filters?categoryId=${brand.id}${slugParam}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setUnwrappedAttributes(data.attributes || []);
        setAllCategoryProductsForFilters(data.filterBaseProducts || []);
        if (data.category) setFreshCategory(data.category); // use fresh ACF from API
      })
      .catch(err => console.error('Failed to load filter data:', err))
      .finally(() => setFilterDataLoading(false));
  }, [brand?.id]);

  
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

  // Handle scroll to top on page/filter changes
  useEffect(() => {
    if (isFirstProductLoad.current) return;
    
    // Immediate scroll to top when navigation changes
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [page, sortBy, selectedFilters, showOnlyInStock]);

  // ------------------------------------------------------------------
  // Filtering Logic — delegates to shared matchesFilters utility
  // ------------------------------------------------------------------
  const checkGlobalMatch = (p: any) =>
    matchesFilters(p, selectedFilters, selectedBrands, unwrappedAttributes, afdichtingsspleetRange, groefbreedteRange, showOnlyInStock, priceRange, isB2B ?? false);

  useEffect(() => {
    async function loadProducts() {
      if (!category) return;

      const hasFilters =
        Object.keys(selectedFilters).length > 0 ||
        selectedBrands.size > 0 ||
        !!afdichtingsspleetRange ||
        !!groefbreedteRange ||
        !!priceRange ||
        showOnlyInStock;

      // On the very first render, use the server-prefetched products when
      // there are no active filters, no custom sort, and we're on page 1.
      if (isFirstProductLoad.current) {
        if (!hasFilters && !sortBy && page === 1) {
          setProducts(initialProducts);
          setRawProducts(initialProducts);
          setTotalPages(initialTotalPages);
          setTotalProducts(initialTotalProducts);
          isFirstProductLoad.current = false;
          return;
        }
        isFirstProductLoad.current = false;
      }

      // When filters are active we MUST have both the filter base and the
      // attribute list ready before we can match correctly.
      // Both are populated asynchronously from streaming server props.
      // If either is still empty, just show a loading indicator and wait —
      // this effect re-runs automatically once they are populated because
      // both are included in the dependency array below.
      if (hasFilters && (allCategoryProductsForFilters.length === 0 || unwrappedAttributes.length === 0)) {
        setProductsLoading(true);
        return; // Effect will re-run when the missing data arrives
      }

      setProductsLoading(true);

      try {
        if (hasFilters) {
          // ── CLIENT-SIDE FILTERING ────────────────────────────────────────
          let matches = allCategoryProductsForFilters.filter(p => checkGlobalMatch(p));

          // Local sort (filter results are already in memory)
          if (sortBy) {
            matches.sort((a, b) => {
              if (sortBy === 'price-low-high') return getFinalPrice(a, isB2B ?? false) - getFinalPrice(b, isB2B ?? false);
              if (sortBy === 'price-high-low') return getFinalPrice(b, isB2B ?? false) - getFinalPrice(a, isB2B ?? false);
              if (sortBy === 'title-asc') return (a.name || '').localeCompare(b.name || '');
              if (sortBy === 'title-desc') return (b.name || '').localeCompare(a.name || '');
              if (sortBy === 'date') return new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime();
              if (sortBy === 'popularity') return (b.total_sales || 0) - (a.total_sales || 0);
              return 0;
            });
          }

          const totalMatches = matches.length;
          const sliced = matches.slice((page - 1) * 20, page * 20);

          // Use the Meilisearch products directly — they already have all
          // the fields needed for ProductCard (name, slug, price, images, etc.)
          setProducts(sliced);
          setTotalProducts(totalMatches);
          setTotalPages(Math.max(1, Math.ceil(totalMatches / 20)));

          // BACKGROUND DEBUG TRACE - Log state unconditionally when filters apply
          fetch('/api/debug-log', {
            method: 'POST',
            body: JSON.stringify({
              event: 'filtering_applied',
              hasFilters,
              matchesCount: totalMatches,
              slicedCount: sliced.length,
              page,
              selectedFiltersKeys: Object.keys(selectedFilters),
              selectedBrandsSize: selectedBrands.size,
              priceRange,
              firstMatchName: sliced.length > 0 ? sliced[0].name : null,
            })
          }).catch(console.error);

        } else {
          // ── SERVER-SIDE PAGINATED FETCH via Meilisearch (no filters) ─────
          const limit = 20;
          const offset = (page - 1) * limit;
          const categorySlug = brand.slug;

          // Build sort for Meilisearch if supported
          let sort: string[] | undefined;
          if (sortBy === 'price-low-high') sort = ['price_amount:asc'];
          else if (sortBy === 'price-high-low') sort = ['price_amount:desc'];

          const res = await fetch('/api/meili-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit, offset, filter: [`category_slug = ${categorySlug}`], sort }),
            cache: 'no-store'
          });

          if (!res.ok) throw new Error('Failed to fetch products');
          const { products: meiliProds, total } = await res.json();

          setProducts(meiliProds);
          setRawProducts(meiliProds);
          setTotalPages(Math.ceil(total / limit) || 1);
          setTotalProducts(total);
        }
      } catch (err) {
        console.error('LoadProducts error:', err);
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  // unwrappedAttributes added so the effect re-runs once attributes resolve,
  // preventing stale-closure mismatches when filtering.
  }, [
    brand?.id,
    selectedFilters,
    selectedBrands,
    afdichtingsspleetRange,
    groefbreedteRange,
    priceRange,
    sortBy,
    page,
    showOnlyInStock,
    isB2B,
    allCategoryProductsForFilters,
    unwrappedAttributes
  ]);

  // Reset page to 1 when category, filters, or sort change (but not on first render)
  useEffect(() => {
    if (isFirstPageReset.current) {
      isFirstPageReset.current = false;
      return;
    }
    setPage(1);
  }, [brand?.id, selectedFilters, selectedBrands, afdichtingsspleetRange, groefbreedteRange, priceRange, sortBy, showOnlyInStock, isB2B]);

  const toggleFilter = (attrId: number, termId: number) => {
    setSelectedFilters(prev => {
      const next = { ...prev };
      if (!next[attrId]) {
        next[attrId] = new Set();
      } else {
        next[attrId] = new Set(next[attrId]);
      }

      if (next[attrId].has(termId)) {
        next[attrId].delete(termId);
        if (next[attrId].size === 0) {
          delete next[attrId];
        }
      } else {
        next[attrId].add(termId);
      }

      return next;
    });
    setPage(1);
  };

  const toggleBrandFilter = (brandId: number) => {
    setSelectedBrands(prev => {
      const newBrands = new Set(prev);
      if (newBrands.has(brandId)) {
        newBrands.delete(brandId);
      } else {
        newBrands.add(brandId);
      }
      return newBrands;
    });
    setPage(1);
  };

  const resetFilters = () => {
    setSelectedFilters({});
    setSelectedBrands(new Set());
    setAfdichtingsspleetRange(null);
    setGroefbreedteRange(null);
    setPriceRange(null);
    setPage(1);
  };

  const handleSetPriceRange = (val: [number, number] | null) => {
    setPriceRange(val);
    setPage(1);
  };

  const handleSetShowOnlyInStock = (val: boolean) => {
    setShowOnlyInStock(val);
    setPage(1);
  };

  // Relevant attributes moved to FilterSidebar component for streaming support


  // Filter validation state moved to FilterSidebar


  return (
    <div className="min-h-screen">
      <div className="max-w-[1440px] mx-auto py-4 lg:py-8 px-5 lg:px-0">
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-8">
          
          {filterDataLoading ? (
            <FilterSidebarSkeleton />
          ) : (
            <FilterSidebar 
              attributes={unwrappedAttributes}
              allCategoryProductsForFilters={allCategoryProductsForFilters}
              category={freshCategory}
              selectedFilters={selectedFilters}
              selectedBrands={selectedBrands}
              toggleFilter={toggleFilter}
              toggleBrandFilter={toggleBrandFilter}
              resetFilters={resetFilters}
              afdichtingsspleetRange={afdichtingsspleetRange}
              groefbreedteRange={groefbreedteRange}
              setAfdichtingsspleetRange={(val) => { setAfdichtingsspleetRange(val); setPage(1); }}
              setGroefbreedteRange={(val) => { setGroefbreedteRange(val); setPage(1); }}
              priceRange={priceRange}
              setPriceRange={handleSetPriceRange}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              showOnlyInStock={showOnlyInStock}
              setShowOnlyInStock={handleSetShowOnlyInStock}
              onFilterCheck={setHasFiltersAvailable}
              isB2B={!!isB2B}
            />
          )}

          {/* Main Content */}
          <main className="flex-1">
            
            <div className={`flex justify-between items-center mb-4 sticky top-[105px] z-40 py-3 -mx-5 px-5 transition-all duration-200 lg:static lg:p-0 lg:mx-0 ${isStuck ? 'bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)] border-b border-gray-200' : 'bg-transparent border-transparent shadow-none'} lg:bg-transparent lg:border-none lg:shadow-none`}> 
              <p className="text-xl lg:text-3xl font-bold text-[#1C2530] truncate pr-2">{brand?.name ?? "Category"}</p>
              <div className='flex items-center gap-2 shrink-0'>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select focus:outline-0 focus:ring-0 border border-gray-300 rounded-md bg-white h-9 min-h-0 text-sm font-medium text-gray-700 pl-3 py-0 w-auto">
                  <option value="">Aanbevolen</option>
                  <option value="popularity">Populariteit</option>
                  <option value="rating">Beoordeling</option>
                  <option value="date">Nieuwste</option>
                  <option value="price-low-high">Prijs: Laag naar Hoog</option>
                  <option value="price-high-low">Prijs: Hoog naar Laag</option>
                  <option value="title-asc">Naam: A - Z</option>
                  <option value="title-desc">Naam: Z - A</option>
                </select>
                {hasFiltersAvailable && (
                  <button type="button" className="lg:hidden flex items-center justify-center gap-1.5 px-3 h-9 bg-[#0066FF] text-white rounded-md font-medium text-sm shadow-sm transition-colors hover:bg-blue-700" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-controls="filters-section">
                    {showFilters ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                      </svg>
                    )}
                    <span>Filter</span>
                  </button>
                )}
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
              <div className="flex flex-col w-full">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 lg:gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="h-full">
                      <ShopProductCard product={product} useCategoryImage={true} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-12 mb-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPage(prev => Math.max(1, prev - 1));
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
                            }}
                            className={`w-10 h-10 flex-shrink-0 rounded-md border font-bold transition-all cursor-pointer text-sm ${
                              page === p
                                ? "bg-[#0066FF] border-[#0066FF] text-white shadow-md shadow-blue-100"
                                : "bg-white border-gray-300 text-gray-600 hover:border-[#0066FF] hover:text-[#0050D1]"
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
            {brand?.description && (
              <div
                className="my-6 prose prose-blue max-w-none leading-relaxed text-gray-800 category-description-style"
                dangerouslySetInnerHTML={{ 
                  __html: brand.description
                    .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
                    .replace(/<meta[^>]*>/gi, '')
                    .replace(/<link[^>]*>/gi, '')
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
