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

        return NextResponse.json(res.data, {
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
