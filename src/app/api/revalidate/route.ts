import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const secret = body.secret;
        const tag = body.tag;

        if (secret !== process.env.REVALIDATE_SECRET) {
            return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
        }

        if (!tag) {
            return NextResponse.json({ message: 'Missing tag param' }, { status: 400 });
        }

        revalidateTag(tag);

        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err) {
        return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
    }
}
