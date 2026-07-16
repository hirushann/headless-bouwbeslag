import { NextResponse } from 'next/server';
import { BOUWBESLAG_CATEGORY_TAGS, BOUWBESLAG_PRODUCT_TAGS } from '@/lib/cache-tags';
import { buildCategoryMembershipFilter } from '@/lib/category-filter';

// This route is always dynamic — no Router Cache interference.
export const dynamic = 'force-dynamic';

const EMPIRE_BASE = (process.env.NEXT_PUBLIC_EMPIRE_API_URL || 'http://empire.test').replace(/\/$/, '') + '/api';
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'https://ezearch.dayzsolutions.com';
const MEILISEARCH_KEY = process.env.MEILISEARCH_KEY || '4aaac5324e39343df8c1981646e2d933aba4d9d0b02bc80c40cd25bb695051ec';
const MEILI_INDEX = process.env.MEILISEARCH_BOUWBESLAG_PRODUCTS_INDEX || 'empire-bouwbeslag-products';

/**
 * Fetch category filter flags from Empire API.
 * Returns which filter panels should be shown for this category.
 */
async function fetchEmpireCategoryFlags(slug: string, isBrandPage: boolean = false) {
  try {
    const endpoint = isBrandPage ? `brands/${slug}` : `categories/${slug}`;
    const res = await fetch(`${EMPIRE_BASE}/${endpoint}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch {
    return null;
  }
}

/**
 * Fetch facet distributions from Meilisearch for a given category slug.
 * This replaces loading all 1000 products — far more efficient.
 */
async function fetchMeiliFilterFacets(categoryIdentity: string | Array<number | string>, isBrandPage: boolean = false) {
  try {
    const body = {
      q: '',
      limit: 0,
      filter: [isBrandPage ? `brand_id = '${String(categoryIdentity)}'` : buildCategoryMembershipFilter(categoryIdentity)],
      facets: ['*'],
    };

    const res = await fetch(`${MEILISEARCH_HOST}/indexes/${MEILI_INDEX}/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MEILISEARCH_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.facetDistribution || {};
  } catch {
    return null;
  }
}

const DYNAMIC_FACETS_CONFIG: Record<string, { facetKey: string, label: string, attrId: number }> = {
  has_colors: { facetKey: 'color', label: 'Kleur', attrId: 9002 },
  has_materials: { facetKey: 'material', label: 'Materiaal', attrId: 9003 },
  has_finishes: { facetKey: 'finish', label: 'Finish', attrId: 9004 },
  has_styles: { facetKey: 'style', label: 'Stijl', attrId: 9005 },
  has_type_of_quality: { facetKey: 'type_of_quality', label: 'Kwaliteitstype', attrId: 9006 },
  has_executions: { facetKey: 'shield_or_rosette_version', label: 'Uitvoering', attrId: 9007 },
  has_shapes: { facetKey: 'form', label: 'Vorm', attrId: 9008 },
  has_front_plate_width: { facetKey: 'front_plate_width', label: 'Voorplaatbreedte', attrId: 9009 },
  has_window_type: { facetKey: 'window_type', label: 'Raamtype', attrId: 9010 },
  has_length: { facetKey: 'length_attr', label: 'Lengte', attrId: 9011 },
  has_window_stay: { facetKey: 'window_stay', label: 'Raamuitzetter', attrId: 9012 },
  has_handle_height: { facetKey: 'handle_height', label: 'Krukhoogte', attrId: 9013 },
  has_hook_a: { facetKey: 'hook_a', label: 'Haak A', attrId: 9014 },
  has_hook_b: { facetKey: 'hook_b', label: 'Haak B', attrId: 9015 },
  has_hook_c: { facetKey: 'hook_c', label: 'Haak C', attrId: 9016 },
  has_spindle: { facetKey: 'spindle', label: 'Stift', attrId: 9017 },
  has_marking: { facetKey: 'marking', label: 'Keurmerk', attrId: 9018 },
  has_offset: { facetKey: 'offset', label: 'Krukas', attrId: 9019 },
  has_cam_size: { facetKey: 'cam_size', label: 'Nokmaat', attrId: 9020 },
  has_rosette_type: { facetKey: 'rosette_type', label: 'Rozettype', attrId: 9021 },
  has_hook_type: { facetKey: 'hook_type', label: 'Haaktype', attrId: 9022 },
  has_type_of_door_fitting_set: { facetKey: 'type_of_door_fitting_set', label: 'Type deurbeslag set', attrId: 9023 },
  has_indoor_outdoor: { facetKey: 'indoor_outdoor', label: 'Binnen/Buiten', attrId: 9024 },
  has_max_door_thickness: { facetKey: 'max_door_thickness', label: 'Max. deurdikte', attrId: 9025 },
  has_with_core_pulling_protection: { facetKey: 'with_core_pulling_protection', label: 'Met kerntrekbeveiliging', attrId: 9026 },
  has_min_door_thickness: { facetKey: 'min_door_thickness', label: 'Min. deurdikte', attrId: 9027 },
  has_package_content: { facetKey: 'package_content', label: 'Verpakkingsinhoud', attrId: 9028 },
  has_series: { facetKey: 'series', label: 'Serie', attrId: 9029 },
  has_type_tochtstrip: { facetKey: 'type_tochtstrip', label: 'Type Tochtstrip', attrId: 9030 },
  has_tochtstrip_toepassing: { facetKey: 'tochtstrip_toepassing', label: 'Tochtstrip Toepassing', attrId: 9031 },
  has_brandvertragend: { facetKey: 'brandvertragend', label: 'Brandvertragend', attrId: 9032 },
  has_breedte_tochtstrip: { facetKey: 'breedte_tochtstrip', label: 'Breedte Tochtstrip', attrId: 9033 },
  has_sponning_tochtstrip: { facetKey: 'sponning_tochtstrip', label: 'Sponning Tochtstrip', attrId: 9034 },
  has_afdichtingsspleet: { facetKey: 'afdichtingsspleet', label: 'Afdichtingsspleet', attrId: 9035 },
  has_groefbreedte: { facetKey: 'groefbreedte', label: 'Groefbreedte', attrId: 9036 },
  has_groefdiepte: { facetKey: 'groefdiepte', label: 'Groefdiepte', attrId: 9037 },
  has_verkropping: { facetKey: 'verkropping', label: 'Verkropping', attrId: 9038 },
  has_afsluitbaarheid: { facetKey: 'afsluitbaarheid', label: 'Afsluitbaarheid', attrId: 9039 },
};

function termSlugToId(attrId: number, slug: string): number {
  // Simple stable hash: attr_base * 10000 + string hash mod 9999
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) & 0xffff;
  }
  return attrId * 10000 + (hash % 9000 + 1);
}

/**
 * Convert Meilisearch facet distribution to attribute format expected by CategoryClient.
 * Each attribute has: id, name, slug, terms[{id, name, slug, count}]
 */
function buildAttributesFromFacets(facets: Record<string, Record<string, number>>, flags: any) {
  const attributes: any[] = [];

  const addFacet = (facetKey: string, label: string, flagKey: string, attrId: number) => {
    if (!flags?.[flagKey]) return;
    const facetData = facets[facetKey] || {};
    const terms = Object.entries(facetData)
      .filter(([, count]) => count > 0)
      .map(([value, count]) => ({
        id: termSlugToId(attrId, value.toLowerCase()),
        name: value,
        slug: value.toLowerCase().replace(/\s+/g, '-'),
        count,
      }));

    if (terms.length === 0) return;

    attributes.push({
      id: attrId,
      name: label,
      slug: facetKey,
      terms,
    });
  };

  for (const [flagKey, config] of Object.entries(DYNAMIC_FACETS_CONFIG)) {
    addFacet(config.facetKey, config.label, flagKey, config.attrId);
  }

  return attributes;
}

/**
 * Build a minimal products list for the client-side filter matching logic.
 * We fetch all products with only the fields needed for filtering (much lighter than full products).
 */
async function fetchFilterBaseProducts(categoryIdentity: string | Array<number | string>, isBrandPage: boolean = false) {
  try {
    const res = await fetch(`${MEILISEARCH_HOST}/indexes/${MEILI_INDEX}/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MEILISEARCH_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: '',
        limit: 2000,
        offset: 0,
        filter: [isBrandPage ? `brand_id = '${String(categoryIdentity)}'` : buildCategoryMembershipFilter(categoryIdentity)],
        attributesToRetrieve: [
          'id', 'slug', 'name', 'color', 'material', 'finish',
          'brand', 'brand_name', 'brand_id', 'stock_status', 'stock',
          'price', 'category_id', 'category_slug', 'category_name',
          'images', 'main_image_url', 'category', 'meta_data',
          'afdichtingsspleet_van', 'afdichtingsspleet_tot', 'groefbreedte_van', 'groefbreedte_tot',
          ...Object.values(DYNAMIC_FACETS_CONFIG).map(c => c.facetKey)
        ],
      }),
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const data = await res.json();

    // Map to WooCommerce-compatible shape for filter matching
    return (data.hits || []).map((p: any) => {
      const ensureArray = (val: any) => Array.isArray(val) ? val : (val ? [val] : []);
      const wooAttributes: any[] = [];
      
      for (const config of Object.values(DYNAMIC_FACETS_CONFIG)) {
        if (p[config.facetKey] !== undefined && p[config.facetKey] !== null && p[config.facetKey] !== '') {
          wooAttributes.push({ id: config.attrId, name: config.label, slug: config.facetKey, options: ensureArray(p[config.facetKey]) });
        }
      }
      const bName = p.brand?.name || p.brand_name;
      const bId = p.brand?.id || p.brand_id;

      const priceAmount = typeof p.price === 'object' ? (p.price?.amount || 0) : (parseFloat(p.price) || 0);

      // Brand in WooCommerce-like shape with a numeric ID derived from brand_name
      const brandId = bId ? (typeof bId === 'number' ? bId : Math.abs(bId.toString().split('').reduce((h: number, c: string) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0))) : (bName ? Math.abs(bName.split('').reduce((h: number, c: string) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0)) : 0);

      return {
        ...p,
        attributes: wooAttributes,
        brands: bName ? [{ id: brandId, name: bName, slug: p.brand_slug || p.brand?.slug || bName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }] : [],
        price: priceAmount.toString(),
        regular_price: priceAmount.toString(),
        stock_status: p.stock?.status === 'in_stock' ? 'instock' : (p.stock_status === 'instock' ? 'instock' : (p.stock_status || 'outofstock')),
        stock_quantity: p.stock?.quantity ?? p.stock_quantity ?? null,
        images: Array.isArray(p.images) ? p.images.map((img: any) => ({ ...img, src: img.url || img.src }))
          : (p.main_image_url ? [{ src: p.main_image_url }] : []),
        meta_data: [],
        resolved_cat_image: p.category?.image?.src || p.category?.image || ""
      };
    });
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get('categorySlug');
  const categoryId = searchParams.get('categoryId'); // kept for backward compat
  const isBrandPage = searchParams.get('isBrandPage') === 'true';

  if (!categorySlug && !categoryId) {
    return NextResponse.json({ error: 'categorySlug is required' }, { status: 400 });
  }

  const slug = categorySlug || '';
  try {
    const empireCategory = await fetchEmpireCategoryFlags(slug, isBrandPage);
    const categoryIdentity = isBrandPage
      ? slug
      : empireCategory?.product_category_ids || [categoryId || ''];
    const [facets, filterBaseProducts] = await Promise.all([
      fetchMeiliFilterFacets(categoryIdentity, isBrandPage),
      fetchFilterBaseProducts(categoryIdentity, isBrandPage),
    ]);

    const attributes = buildAttributesFromFacets(facets || {}, empireCategory || {});

    // Attach the Empire filter flags directly to the category object
    // so CategoryClient knows which extra filters (afsluitbaarheid, etc.) to show
    const category = empireCategory
      ? { ...empireCategory, slug }
      : null;

    return NextResponse.json(
      { attributes, filterBaseProducts, category, facets },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('category-filters error:', error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}
