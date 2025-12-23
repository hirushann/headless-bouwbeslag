import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl";

    try {
        const res = await fetch(`${WP_API_URL}/wp-json/wp/v2/users/me?context=edit`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            // Attempt to read error body if any
            const errorBody = await res.text();
            console.error(`WP API Error (${res.status}): ${errorBody}`);
            return NextResponse.json({ error: res.statusText, details: errorBody }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Proxy Error fetching user:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
