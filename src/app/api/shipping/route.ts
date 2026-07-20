import { NextResponse } from "next/server";
import { getShippingSettings, getShippingRules } from "@/lib/woocommerce";

export const dynamic = 'force-dynamic'; // Ensures this API route always fetches the latest settings

export async function GET() {
    try {
        const [settings, rules] = await Promise.all([
            getShippingSettings(),
            getShippingRules()
        ]);
        
        return NextResponse.json({ settings, rules });
    } catch (error) {
        return NextResponse.json({ settings: [], rules: [] }, { status: 500 });
    }
}
