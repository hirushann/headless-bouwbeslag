import { NextResponse } from 'next/server';
import api from '@/lib/woocommerce';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const params: any = {};

    searchParams.forEach((value, key) => {
        params[key] = value;
    });

    try {
        const res = await api.get('products', params);
        const products = Array.isArray(res.data) ? res.data : [];

        // --- ENHANCEMENT: Pre-resolve category images for speed ---
        const mediaIds = new Set<string>();
        products.forEach((p: any) => {
            const catImgId = p.meta_data?.find((m: any) => m.key === "assets_cat_image")?.value ||
                p.meta_data?.find((m: any) => m.key === "cat_image")?.value;
            if (catImgId && /^\d+$/.test(String(catImgId))) {
                mediaIds.add(String(catImgId));
            }
        });

        if (mediaIds.size > 0) {
            try {
                // Fetch all unique media info in ONE call
                const mediaRes = await api.get('wp/v2/media', {
                    include: Array.from(mediaIds).join(','),
                    per_page: 100,
                    _fields: 'id,source_url'
                });

                if (Array.isArray(mediaRes.data)) {
                    const mediaMap = new Map();
                    mediaRes.data.forEach((m: any) => mediaMap.set(String(m.id), m.source_url));

                    // Inject resolved URLs back into products
                    products.forEach((p: any) => {
                        const catImgId = p.meta_data?.find((m: any) => m.key === "assets_cat_image")?.value ||
                            p.meta_data?.find((m: any) => m.key === "cat_image")?.value;
                        if (catImgId && mediaMap.has(String(catImgId))) {
                            p.resolved_cat_image = mediaMap.get(String(catImgId));
                        }
                    });
                }
            } catch (mediaErr) {
                // console.error("Error resolving media IDs:", mediaErr);
            }
        }

        return NextResponse.json(products, {
            headers: {
                'x-wp-total': res.total || '0',
                'x-wp-totalpages': res.totalPages || '0',
                'Access-Control-Expose-Headers': 'x-wp-total, x-wp-totalpages'
            }
        });
    } catch (error: any) {
        // console.error('Error fetching products:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching products' },
            { status: 500 }
        );
    }
}
