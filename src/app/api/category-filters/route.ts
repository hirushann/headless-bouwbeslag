import { NextResponse } from 'next/server';

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
async function fetchEmpireCategoryFlags(slug: string) {
  try {
    const res = await fetch(`${EMPIRE_BASE}/categories/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch facet distributions from Meilisearch for a given category slug.
 * This replaces loading all 1000 products — far more efficient.
 */
async function fetchMeiliFilterFacets(categorySlug: string) {
  try {
    const body = {
      q: '',
      limit: 0,
      filter: [`category_slug = ${categorySlug}`],
      facets: ['color', 'material', 'finish', 'brand_name', 'stock_status'],
    };

    const res = await fetch(`${MEILISEARCH_HOST}/indexes/${MEILI_INDEX}/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MEILISEARCH_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.facetDistribution || {};
  } catch {
    return null;
  }
}

// Deterministic numeric IDs for Empire facets (avoids conflict with WooCommerce attr IDs which are small ints)
const EMPIRE_ATTR_ID: Record<string, number> = {
  brand_name: 9001,
  color:      9002,
  material:   9003,
  finish:     9004,
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

  const addFacet = (facetKey: string, label: string, flagKey: string) => {
    if (!flags?.[flagKey]) return;
    const attrId = EMPIRE_ATTR_ID[facetKey];
    if (!attrId) return;
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

  addFacet('color', 'Kleur', 'has_colors');
  addFacet('material', 'Materiaal', 'has_materials');
  addFacet('finish', 'Finish', 'has_finishes');

  return attributes;
}

/**
 * Build a minimal products list for the client-side filter matching logic.
 * We fetch all products with only the fields needed for filtering (much lighter than full products).
 */
async function fetchFilterBaseProducts(categorySlug: string) {
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
        filter: [`category_slug = ${categorySlug}`],
        attributesToRetrieve: [
          'id', 'slug', 'name', 'color', 'material', 'finish',
          'brand', 'brand_name', 'brand_id', 'stock_status', 'stock',
          'price', 'category_id', 'category_slug', 'category_name',
          'images', 'main_image_url',
        ],
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();

    // Map to WooCommerce-compatible shape for filter matching
    return (data.hits || []).map((p: any) => {
      const ensureArray = (val: any) => Array.isArray(val) ? val : (val ? [val] : []);
      const wooAttributes: any[] = [];
      if (p.color) wooAttributes.push({ id: 9002, name: 'Kleur', slug: 'color', options: ensureArray(p.color) });
      if (p.material) wooAttributes.push({ id: 9003, name: 'Materiaal', slug: 'material', options: ensureArray(p.material) });
      if (p.finish) wooAttributes.push({ id: 9004, name: 'Finish', slug: 'finish', options: ensureArray(p.finish) });
      
      const bName = p.brand?.name || p.brand_name;
      const bId = p.brand?.id || p.brand_id;

      const priceAmount = typeof p.price === 'object' ? (p.price?.amount || 0) : (parseFloat(p.price) || 0);

      // Brand in WooCommerce-like shape with a numeric ID derived from brand_name
      const brandId = bId ? (typeof bId === 'number' ? bId : Math.abs(bId.toString().split('').reduce((h: number, c: string) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0))) : (bName ? Math.abs(bName.split('').reduce((h: number, c: string) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0)) : 0);

      return {
        ...p,
        attributes: wooAttributes,
        brands: bName ? [{ id: brandId, name: bName }] : [],
        price: priceAmount.toString(),
        regular_price: priceAmount.toString(),
        stock_status: p.stock?.status === 'in_stock' ? 'instock' : 'outofstock',
        stock_quantity: p.stock?.quantity ?? null,
        images: Array.isArray(p.images) ? p.images.map((img: any) => ({ ...img, src: img.url || img.src }))
          : (p.main_image_url ? [{ src: p.main_image_url }] : []),
        meta_data: [],
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

  if (!categorySlug && !categoryId) {
    return NextResponse.json({ error: 'categorySlug is required' }, { status: 400 });
  }

  const slug = categorySlug || '';

  try {
    const [empireCategory, facets, filterBaseProducts] = await Promise.all([
      fetchEmpireCategoryFlags(slug),
      fetchMeiliFilterFacets(slug),
      fetchFilterBaseProducts(slug),
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
