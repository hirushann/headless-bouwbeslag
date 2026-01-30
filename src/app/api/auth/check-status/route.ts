import { NextResponse } from "next/server";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string,
    consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY as string,
    consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET as string,
    version: "wc/v3",
});

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: "Email required" }, { status: 400 });
        }

        // Fetch customer by email to check meta data
        // WooCommerce API allows filtering by email
        const response = await api.get("customers", { email: email });

        if (response.data.length === 0) {
            // If not found in WC, maybe they are a normal WP user or purely admin?
            // Assuming if they logged in successfully, they exist.
            // If they are not a WC customer, we assume they are allowed (e.g. Admin) or regular user without restrictions.
            return NextResponse.json({ status: "allowed" });
        }

        const customer = response.data[0];

        // Check b2b_status meta
        const statusMeta = customer.meta_data.find((m: any) => m.key === "b2b_status");
        const status = statusMeta ? statusMeta.value : "approved"; // If no meta, default to approved (old users/regular users)

        // Also check if they are actually a B2B user role if not strictly relying on meta?
        // But the requirement is about the registration flow we just built.

        // If it is 'pending' or 'rejected', deny access
        if (status === "pending" || status === "rejected") {
            return NextResponse.json({ status: "denied", reason: status });
        }

        return NextResponse.json({ status: "allowed" });

    } catch (error: any) {
        // console.error("Check Status Error:", error);
        return NextResponse.json({ message: "Error checking status" }, { status: 500 });
    }
}
