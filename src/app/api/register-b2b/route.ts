import { NextResponse } from "next/server";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// Initialize WooCommerce API with environment variables
const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string,
    consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY as string,
    consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET as string,
    version: "wc/v3",
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            email,
            password,
            first_name,
            last_name,
            company_name,
            coc_number,
            vat_number
        } = body;

        // Basic validation
        if (!email || !password || !first_name || !last_name || !company_name) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // specific role for b2b
        const role = "b2b_customer";

        const data = {
            email,
            password,
            first_name,
            last_name,
            username: email,
            role,
            billing: {
                first_name,
                last_name,
                company: company_name,
                email,
            },
            shipping: {
                first_name,
                last_name,
                company: company_name,
            },
            meta_data: [
                {
                    key: "kvk_nummer",
                    value: coc_number,
                },
                {
                    key: "btw_nummer",
                    value: vat_number,
                },
                {
                    key: "billing_company",
                    value: company_name
                }
            ],
        };

        const response = await api.post("customers", data);

        if (response.status === 201) {
            return NextResponse.json(
                { message: "Account created successfully", customer: response.data },
                { status: 201 }
            );
        } else {
            return NextResponse.json(
                { message: "Failed to create account" },
                { status: response.status }
            );
        }

    } catch (error: any) {
        console.error("Registration error:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || error.message || "Internal Server Error";
        return NextResponse.json(
            { message: errorMessage },
            { status: 500 }
        );
    }
}
