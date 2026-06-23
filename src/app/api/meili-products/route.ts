import { NextResponse } from 'next/server';
import { fetchMeiliProducts, mapMeiliToWooProduct } from '@/lib/meilisearch-products';

export const dynamic = 'force-dynamic';

/**
 * POST /api/meili-products
 * Body: { limit, offset, filter, sort, q }
 *
 * Proxy for Meilisearch searches from client components.
 * Returns mapped products in WooCommerce-compatible shape.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { limit = 20, offset = 0, filter = [], sort, q = '' } = body;

    const { products, total } = await fetchMeiliProducts(limit, offset, q, filter, sort);

    return NextResponse.json(
      { products: products.map(mapMeiliToWooProduct), total },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('meili-products API error:', err);
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
