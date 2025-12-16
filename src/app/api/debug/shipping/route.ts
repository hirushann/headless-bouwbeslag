import { NextResponse } from "next/server";
import api from "@/lib/woocommerce";

export async function GET() {
    try {
        const { data: zones } = await api.get("shipping/zones");

        // Fetch methods for ALL zones
        const zonesWithMethods = await Promise.all(zones.map(async (zone: any) => {
            const { data: methods } = await api.get(`shipping/zones/${zone.id}/methods`);
            return { ...zone, methods };
        }));

        return NextResponse.json({ zonesWithMethods });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
