
import { NextResponse } from 'next/server';
import { fetchProductBySkuOrIdAction } from '@/app/actions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('id') || "8716075880950";

    const res = await fetchProductBySkuOrIdAction(identifier);
    return NextResponse.json(res);
}
