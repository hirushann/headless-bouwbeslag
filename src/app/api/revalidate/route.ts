import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { BOUWBESLAG_CONTENT_TAGS } from '@/lib/cache-tags';

const ALLOWED_TAGS = new Set<string>(BOUWBESLAG_CONTENT_TAGS);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        
        const secret = body.secret;
        const tags = Array.isArray(body.tags)
            ? body.tags
            : body.tag
                ? [body.tag]
                : [];

        if (secret !== process.env.REVALIDATE_SECRET) {
            return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
        }

        if (tags.length === 0) {
            return NextResponse.json({ message: 'Missing tag param' }, { status: 400 });
        }

        const invalidTags = tags.filter((tag: string) => !ALLOWED_TAGS.has(tag));

        if (invalidTags.length > 0) {
            return NextResponse.json({ message: 'Invalid tag', invalidTags }, { status: 400 });
        }

        tags.forEach((tag: string) => revalidateTag(tag));

        return NextResponse.json({ revalidated: true, tags, now: Date.now() });
    } catch (err) {
        return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
    }
}
