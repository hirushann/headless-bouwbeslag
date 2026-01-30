import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    let targetUrl: URL;
    try {
        targetUrl = new URL(url);
    } catch (e) {
        return new NextResponse('Invalid URL', { status: 400 });
    }

    // Security: Only allow requests to our own domains
    const allowedDomains = ['app.bouwbeslag.nl', 'bouwbeslag.nl', 'www.bouwbeslag.nl'];
    if (!allowedDomains.includes(targetUrl.hostname)) {
        return new NextResponse('Domain not allowed', { status: 403 });
    }

    // Create Basic Auth header
    const CK = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
    const CS = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;
    const auth = Buffer.from(`${CK}:${CS}`).toString('base64');

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });

        if (!response.ok) {
            return new NextResponse(`Error fetching content: ${response.statusText}`, { status: response.status });
        }

        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';

        // Create a new response with the body stream
        const newResponse = new NextResponse(response.body, {
            status: response.status,
            headers: {
                'Content-Type': contentType,
                // Allow this proxy to be framed or accessed
                'Access-Control-Allow-Origin': '*',
                'X-Frame-Options': 'SAMEORIGIN'
            },
        });

        return newResponse;

    } catch (error) {
        // console.error('Proxy Fetch Error:', error);
        return new NextResponse('Error fetching content', { status: 500 });
    }
}
