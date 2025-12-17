import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
    try {
        const STORE_API_URL = `${(process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl").replace(/\/$/, "")}/wp-json/wc/store/v1`;
        const cookieHeader = req.headers.get("cookie") || "";
        const authHeader = req.headers.get("authorization");

        const headers: any = {
            "Content-Type": "application/json",
            "Cookie": cookieHeader,
        };
        if (authHeader) {
            headers["Authorization"] = authHeader;
        } else if (process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET) {
            const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64');
            headers["Authorization"] = `Basic ${auth}`;
        }

        const response = await axios.get(`${STORE_API_URL}/cart`, { headers, withCredentials: true });

        const nextRes = NextResponse.json(response.data);

        // Forward headers
        const setCookie = response.headers["set-cookie"];
        if (setCookie) {
            if (Array.isArray(setCookie)) {
                setCookie.forEach(c => nextRes.headers.append("Set-Cookie", c));
            } else {
                nextRes.headers.set("Set-Cookie", setCookie);
            }
        }
        const nonce = response.headers["x-wc-store-api-nonce"];
        if (nonce) nextRes.headers.set("x-wc-store-api-nonce", nonce);

        return nextRes;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, productId, quantity, key } = body;

        // Base URL for Store API
        const STORE_API_URL = `${(process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl").replace(/\/$/, "")}/wp-json/wc/store/v1`;

        // Get cookies from the incoming request to forward to WP
        const cookieHeader = req.headers.get("cookie") || "";
        const storeApiNonce = req.headers.get("x-wc-store-api-nonce");
        const authHeader = req.headers.get("authorization");

        const headers: any = {
            "Content-Type": "application/json",
            "Cookie": cookieHeader, // Forward cookies (session)
        };

        if (storeApiNonce) {
            headers["X-WC-Store-API-Nonce"] = storeApiNonce;
        }
        if (authHeader) {
            headers["Authorization"] = authHeader;
        } else if (process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET) {
            // Fallback to Basic Auth if no user token
            const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64');
            headers["Authorization"] = `Basic ${auth}`;
        }

        let response;

        if (action === "add") {
            response = await axios.post(
                `${STORE_API_URL}/cart/add-item`,
                { id: productId, quantity },
                { headers, withCredentials: true }
            );
        } else if (action === "remove") {
            // For remove, we need the item key. If not provided, we might need to fetch cart first.
            // But typically our frontend helper finds the key.
            if (!key && productId) {
                // If we only have productId, we must find the key first. 
                // Ideally the frontend sends the key, but strict sync might only have ID.
                // Let's do a fetch cart here if needed? 
                // Actually, let's keep it simple: Frontend should pass key if possible, 
                // OR we implement the find logic here. 
                // Re-implementing "find key by ID" server-side:
                const cartRes = await axios.get(`${STORE_API_URL}/cart`, { headers, withCredentials: true });
                const item = cartRes.data.items.find((i: any) => i.id === productId);
                if (item) {
                    response = await axios.delete(
                        `${STORE_API_URL}/cart/items/${item.key}`,
                        { headers, withCredentials: true }
                    );
                } else {
                    // Item not found, effectively removed
                    return NextResponse.json({ success: true, message: "Item not found in remote cart" });
                }
            } else if (key) {
                response = await axios.delete(
                    `${STORE_API_URL}/cart/items/${key}`,
                    { headers, withCredentials: true }
                );
            }
        }

        if (!response) {
            return NextResponse.json({ success: false, message: "Invalid action or missing data" }, { status: 400 });
        }

        // Create response
        const nextRes = NextResponse.json(response.data);

        // Forward Set-Cookie headers from WP back to client
        const setCookie = response.headers["set-cookie"];
        if (setCookie) {
            // set-cookie can be an array or string
            if (Array.isArray(setCookie)) {
                setCookie.forEach((cookie) => {
                    nextRes.headers.append("Set-Cookie", cookie);
                });
            } else {
                nextRes.headers.set("Set-Cookie", setCookie);
            }
        }

        // Forward Nonce if updated
        const newNonce = response.headers["x-wc-store-api-nonce"];
        if (newNonce) {
            nextRes.headers.set("x-wc-store-api-nonce", newNonce);
        }

        return nextRes;

    } catch (error: any) {
        console.error("Cart Proxy Error:", error.message);
        const status = error.response?.status || 500;
        const data = error.response?.data || { message: error.message };
        return NextResponse.json(data, { status });
    }
}
