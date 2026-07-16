import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const EMPIRE_API_URL = process.env.EMPIRE_BACKEND_API_URL || process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test";
    const BASE_URL = EMPIRE_API_URL.replace(/\/$/, "");

    try {
        // 1. Fetch Basic User Profile
        const profileRes = await fetch(`${BASE_URL}/api/profile`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        });

        if (!profileRes.ok) {
            const errorBody = await profileRes.text();
            return NextResponse.json({ error: profileRes.statusText, details: errorBody }, { status: profileRes.status });
        }

        const profileData = await profileRes.json();
        const userData = profileData.data || profileData;

        // 2. Fetch Customer Address Details (for billing/shipping)
        try {
            const addressRes = await fetch(`${BASE_URL}/api/customer/address`, {
                method: 'GET',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/json'
                }
            });

            if (addressRes.ok) {
                const addressData = await addressRes.json();
                const address = addressData.data || addressData;
                // Merge user data, adding billing/shipping explicitly
                return NextResponse.json({
                    ...userData,
                    billing: address.billing || {},
                    shipping: address.shipping || {}
                });
            }
        } catch (addrErr) {
            // Ignore error fetching address, return at least profile
        }

        return NextResponse.json(userData);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';
