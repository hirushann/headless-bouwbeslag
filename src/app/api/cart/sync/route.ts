import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import path from "path";
import dotenv from "dotenv";

// Explicitly load .env.local to ensure vars are present in API route
// console.log("CWD:", process.cwd());
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export async function GET(req: NextRequest) {
    // console.log("Proxy: GET request received 2");
    try {
        const STORE_API_URL = `${(process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl").replace(/\/$/, "")}/wp-json/wc/store/v1`;
        const cookieHeader = req.headers.get("cookie") || "";
        const authHeader = req.headers.get("authorization");

        const headers: any = {
            "Content-Type": "application/json",
            "Cookie": cookieHeader,
        };
        if (authHeader) {
            // console.log("Proxy: Using Auth Header from client");
            headers["Authorization"] = authHeader;
        } else if (process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET) {
            // console.log("Proxy: Using Basic Auth from ENV");
            const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64');
            headers["Authorization"] = `Basic ${auth}`;
        } else {
            console.warn("Proxy: No Auth credentials found!");
        }

        // console.log(`Proxy: Forwarding ${req.method} request to ${STORE_API_URL}/cart`);
        const response = await axios.get(`${STORE_API_URL}/cart`, { headers, withCredentials: true });
        // console.log("Proxy: GET Success", response.status);

        // Debug headers from WP
        // console.log("Proxy: WP Headers received:", JSON.stringify(Object.keys(response.headers)));
        // console.log("Proxy: WP Nonce received:", response.headers["x-wc-store-api-nonce"]);

        const nextRes = NextResponse.json(response.data);

        // Forward headers
        const setCookie = response.headers["set-cookie"];
        if (setCookie) {
            const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
            cookies.forEach(c => {
                // Strip Domain and Secure to ensure localhost accepts them
                const cleaned = c
                    .replace(/Domain=[^;]+;?/i, "")
                    .replace(/Secure;?/i, "")
                    .replace(/SameSite=[^;]+;?/i, "SameSite=Lax;");

                nextRes.headers.append("Set-Cookie", cleaned);
            });
        }
        const nonce = response.headers["x-wc-store-api-nonce"] || response.headers["nonce"];
        if (nonce) {
            // console.log("Proxy: Consolidating Nonce:", nonce);
            nextRes.headers.set("x-wc-store-api-nonce", nonce);
        }

        return nextRes;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.response?.status || 500 });
    }
}

export async function POST(req: NextRequest) {
    // console.log("Proxy: POST request received");
    try {
        const body = await req.json();
        const { action, productId, quantity, key } = body;

        // Base URL for Store API
        const STORE_API_URL = `${(process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://app.bouwbeslag.nl").replace(/\/$/, "")}/wp-json/wc/store/v1`;

        // Get cookies from the incoming request to forward to WP
        const cookieHeader = req.headers.get("cookie") || "";
        // console.log(`Proxy POST: Cookies received: ${cookieHeader ? 'Yes (' + cookieHeader.length + ' chars)' : 'NO'}`);

        const storeApiNonce = req.headers.get("x-wc-store-api-nonce");
        const authHeader = req.headers.get("authorization");

        const headers: any = {
            "Content-Type": "application/json",
            "Cookie": cookieHeader, // Forward cookies (session)
        };

        if (storeApiNonce) {
            // console.log("Proxy POST: Nonce received from client");
            headers["X-WC-Store-API-Nonce"] = storeApiNonce;
            headers["Nonce"] = storeApiNonce; // Match the header WP sent us
            headers["X-WP-Nonce"] = storeApiNonce; // Common WP standard
        } else {
            console.warn("Proxy POST: No Nonce in client request!");
        }
        if (authHeader) {
            // console.log("Proxy POST: Using Auth Header from client:", authHeader.substring(0, 15) + "...");
            headers["Authorization"] = authHeader;
        } else if (process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET) {
            // console.log("Proxy POST: Falling back to Basic Auth");
            const auth = Buffer.from(`${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`).toString('base64');
            headers["Authorization"] = `Basic ${auth}`;
        } else {
            console.warn("Proxy POST: No Auth credentials found!");
        }

        // Add User-Agent to avoid firewall blocking
        headers["User-Agent"] = "NextJS-Proxy/1.0";


        // console.log(`Proxy: POST action=${action} productId=${productId}`);

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
        } else if (action === "update") {
            // console.log(`Proxy: Update action for ID=${productId} Qty=${quantity}`);
            // For update, we need item key
            let itemKey = key;
            if (!itemKey && productId) {
                // Find key by ID
                // console.log("Proxy: Finding item key by ID...");
                const cartRes = await axios.get(`${STORE_API_URL}/cart`, { headers, withCredentials: true });
                const item = cartRes.data.items.find((i: any) => i.id === productId);
                if (item) {
                    itemKey = item.key;
                    // console.log("Proxy: Found key:", itemKey);
                } else {
                    console.warn("Proxy: Item not found in remote cart");
                }
            }

            if (itemKey) {
                // console.log(`Proxy: Updating item ${itemKey} to qty ${quantity}`);
                response = await axios.put(
                    `${STORE_API_URL}/cart/items/${itemKey}`,
                    { quantity: quantity },
                    { headers, withCredentials: true }
                );
            } else {
                return NextResponse.json({ success: false, message: "Item not found for update" });
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
        // console.error("Cart Proxy Error:", error.message);
        // if (error.response) {
        //     console.error("Cart Proxy Error Data:", JSON.stringify(error.response.data));
        //     console.error("Cart Proxy Error Headers:", JSON.stringify(error.response.headers));
        // }
        const status = error.response?.status || 500;
        const data = error.response?.data || { message: error.message };
        return NextResponse.json(data, { status });
    }
}
