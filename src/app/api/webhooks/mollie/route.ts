
import { NextRequest, NextResponse } from "next/server";
import mollieClient from "@/lib/mollie";
import api from "@/lib/woocommerce";

export async function POST(req: NextRequest) {
    try {
        // Mollie sends the payment ID as a form-urlencoded body
        const text = await req.text();
        const params = new URLSearchParams(text);
        const paymentId = params.get("id");

        if (!paymentId) {
            return NextResponse.json({ message: "Missing payment ID" }, { status: 400 });
        }

        const payment = await mollieClient.payments.get(paymentId);
        const orderId = (payment.metadata as any)?.order_id;

        if (!orderId) {
            console.error("Order ID not found in payment metadata");
            return NextResponse.json({ message: "Order ID missing" }, { status: 200 }); // Return 200 to acknowledge webhook
        }

        let newStatus = "";

        if (payment.status == 'paid') {
            newStatus = "processing";
        } else if (payment.status == 'canceled' || payment.status == 'expired') {
            newStatus = "cancelled";
        } else if (payment.status == 'failed') {
            newStatus = "failed";
        }

        if (newStatus) {
            await api.put(`orders/${orderId}`, {
                status: newStatus,
                transaction_id: payment.id,
            });
        }

        return NextResponse.json({ message: "Webhook received" }, { status: 200 });
    } catch (error) {
        console.error("Mollie Webhook Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
