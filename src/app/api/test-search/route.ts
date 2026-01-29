
import { NextResponse } from 'next/server';
import { searchProducts } from '@/actions/search';

export async function GET() {
  const res = await searchProducts("deur");
  return NextResponse.json(res);
}
