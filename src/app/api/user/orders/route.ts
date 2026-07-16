import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
        return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const EMPIRE_API_URL = process.env.EMPIRE_BACKEND_API_URL || process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test";
    const BASE_URL = EMPIRE_API_URL.replace(/\/$/, "");

    try {
        const res = await fetch(`${BASE_URL}/api/account/orders`, {
            headers: {
                Authorization: authHeader,
                Accept: "application/json"
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch orders from backend" }, { status: res.status });
        }

        const data = await res.json();
        // Empire API might return { data: [...] } or just [...]
        const orders = data.data || data || [];

        return NextResponse.json(orders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic";
