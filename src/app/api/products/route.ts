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
        // Return the response data with CORS headers handled by Next.js automatically
        return NextResponse.json(res.data);
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { message: error.message || 'Error fetching products' },
            { status: 500 }
        );
    }
}
