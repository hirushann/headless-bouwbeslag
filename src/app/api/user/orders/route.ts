import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
        return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl";

    try {
        // 1. Verify User and Get ID
        const userRes = await fetch(`${WP_API_URL}/wp-json/wp/v2/users/me?context=edit`, {
            headers: {
                Authorization: authHeader,
            },
        });

        if (!userRes.ok) {
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        const user = await userRes.json();
        const userId = user.id;

        if (!userId) {
            return NextResponse.json({ error: "User ID not found" }, { status: 404 });
        }

        // 2. Fetch Orders using Admin/Consumer Keys via lib/woocommerce
        // api.get uses the configured Consumer Key/Secret which has admin read access.
        // Query parameters explicitly filtering by customer ID.
        const { data: orders } = await api.get("orders", {
            customer: userId,
            per_page: 50, // Reasonable limit
        });

        return NextResponse.json(orders);
    } catch (error: any) {
        console.error("Order fetch error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
    }
}
