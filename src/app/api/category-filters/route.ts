import { NextResponse } from 'next/server';
import api from '@/lib/woocommerce';

// This route is always dynamic — no Router Cache interference.
// The underlying WooCommerce fetch calls use a 60-second revalidation
// so they're fast (cache hit) on repeat requests but auto-refresh
// within one minute of any WooCommerce/ACF change. No hard refresh needed.
export const dynamic = 'force-dynamic';

const FILTER_REVALIDATE = 60; // seconds

async function fetchTermsForAttribute(attributeId: number) {
  try {
    const res = await api.get(`products/attributes/${attributeId}/terms`, {
      per_page: 100,
      _fields: 'id,name,slug',
      next: { revalidate: FILTER_REVALIDATE },
    });
    return res.data || [];
  } catch {
    return [];
  }
}

async function fetchAttributes() {
  try {
    const res = await api.get('products/attributes', {
      per_page: 100,
      _fields: 'id,name,slug',
      next: { revalidate: FILTER_REVALIDATE },
    });
    const attributesData = res.data || [];
    return await Promise.all(
      attributesData.map(async (attr: any) => {
        const terms = await fetchTermsForAttribute(attr.id);
        return { id: attr.id, name: attr.name, slug: attr.slug, terms };
      })
    );
  } catch {
    return [];
  }
}

async function fetchCategoryWithAcf(categoryId: number) {
  try {
    const res = await api.get(`products/categories/${categoryId}`, {
      _fields: 'id,name,slug,description,acf,parent,image',
      next: { revalidate: FILTER_REVALIDATE },
    });
    return res.data || null;
  } catch {
    return null;
  }
}

async function fetchAllCategoryProducts(categoryId: number) {
  try {
    const firstPage = await api.get('products', {
      category: categoryId,
      per_page: 100,
      page: 1,
      _fields: 'id,attributes,brands,price,name,date_created,total_sales,stock_quantity,stock_status',
      status: 'publish',
      next: { revalidate: FILTER_REVALIDATE },
    });

    if (!firstPage.data || firstPage.data.length === 0) return [];

    let allProducts = [...firstPage.data];
    const totalPagesCount = parseInt(firstPage.totalPages || '1');
    const pagesToFetch = Math.min(totalPagesCount, 10);

    if (pagesToFetch > 1) {
      const pagePromises = [];
      for (let p = 2; p <= pagesToFetch; p++) {
        pagePromises.push(
          api.get('products', {
            category: categoryId,
            per_page: 100,
            page: p,
            _fields: 'id,attributes,brands,price,name,date_created,total_sales,stock_quantity,stock_status',
            status: 'publish',
            next: { revalidate: FILTER_REVALIDATE },
          })
        );
      }
      const results = await Promise.all(pagePromises);
      results.forEach((res) => {
        if (res.data) allProducts = [...allProducts, ...res.data];
      });
    }
    return allProducts;
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');

  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
  }

  try {
    const [attributes, filterBaseProducts, freshCategory] = await Promise.all([
      fetchAttributes(),
      fetchAllCategoryProducts(Number(categoryId)),
      fetchCategoryWithAcf(Number(categoryId)),
    ]);

    return NextResponse.json(
      { attributes, filterBaseProducts, category: freshCategory },
      {
        headers: {
          // Tell the browser not to cache — freshness handled server-side above
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch filters' }, { status: 500 });
  }
}
