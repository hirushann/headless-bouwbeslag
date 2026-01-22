import { NextRequest, NextResponse } from 'next/server';
import api from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl";

    try {
        // 1. Fetch Basic User Info to get ID
        const res = await fetch(`${WP_API_URL}/wp-json/wp/v2/users/me?context=edit`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorBody = await res.text();
            console.error(`WP API Error (${res.status}): ${errorBody}`);
            return NextResponse.json({ error: res.statusText, details: errorBody }, { status: res.status });
        }

        const userData = await res.json();

        // 2. Fetch WooCommerce Customer Details (for billing/shipping)
        if (userData && userData.id) {
            try {
                // Use server-side API client which has Consumer Key/Secret
                // This ensures we get the data even if the user token has limited scope for this endpoint
                // but we trust the user because we validated the token against wp/v2/users/me above.
                const { data: customerData } = await api.get(`customers/${userData.id}`);

                if (customerData) {
                    // Merge user data, preferring customerData for billing/shipping
                    return NextResponse.json({ ...userData, ...customerData });
                }
            } catch (custErr) {
                console.error("Error fetching WC customer data:", custErr);
            }
        }

        return NextResponse.json(userData);
    } catch (error) {
        console.error("Proxy Error fetching user:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
