import { NextRequest, NextResponse } from "next/server";
import { reconcileMollieOrder } from "@/lib/mollie-order-processing";

export async function POST(req: NextRequest) {
    try {
        // Mollie sends the payment ID as a form-urlencoded body
        const text = await req.text();
        const params = new URLSearchParams(text);
        const paymentId = params.get("id");

        if (!paymentId) {
            return NextResponse.json({ message: "Missing payment ID" }, { status: 400 });
        }

        await reconcileMollieOrder({ paymentId });
        return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
    } catch (error: any) {
        console.error("Failed to reconcile Mollie payment:", error?.response?.data || error.message);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
