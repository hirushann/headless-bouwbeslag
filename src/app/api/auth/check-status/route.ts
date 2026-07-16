import { NextResponse } from "next/server";

// Disabled because Bouwbeslag is no longer connected to WordPress/WooCommerce.
// Authentication and B2B status now come from the Laravel API.
export async function POST() {
    return NextResponse.json(
        { message: "Legacy WooCommerce customer status is no longer available." },
        { status: 410 }
    );
}

/*
Legacy implementation retained for reference:

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

let apiInstance: any = null;

function getApi() {
    if (!apiInstance) {
        apiInstance = new WooCommerceRestApi({
            url: process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string,
            consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY as string,
            consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET as string,
            version: "wc/v3",
        });
    }
    return apiInstance;
}

export async function legacyPost(req: Request) {
    const { email } = await req.json();

    if (!email) {
        return NextResponse.json({ message: "Email required" }, { status: 400 });
    }

    const api = getApi();
    const response = await api.get("customers", { email });

    if (response.data.length === 0) {
        return NextResponse.json({ status: "allowed" });
    }

    const customer = response.data[0];
    const statusMeta = customer.meta_data.find((meta: any) => meta.key === "b2b_status");
    const status = statusMeta ? statusMeta.value : "approved";

    if (status === "pending" || status === "rejected") {
        return NextResponse.json({ status: "denied", reason: status });
    }

    return NextResponse.json({ status: "allowed" });
}
*/
