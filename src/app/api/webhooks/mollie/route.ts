import { NextRequest, NextResponse } from "next/server";
import mollieClient from "@/lib/mollie";
import { getCheckoutSession, deleteCheckoutSession } from "@/lib/checkout-session";
import axios from "axios";

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
        const metadata = payment.metadata as any;
        const orderReference = metadata?.order_reference || metadata?.order_id; // Support old & new

        if (!orderReference) {
            return NextResponse.json({ message: "Order Reference missing" }, { status: 200 });
        }

        // Check if this is the new checkout session flow
        if (orderReference.startsWith("NEXT-") || orderReference.startsWith("BW-")) {
            const isPaid = payment.status === 'paid';
            const isFailed = ['canceled', 'expired', 'failed'].includes(payment.status);
            
            if (isPaid || isFailed) {
                const sessionPayload = await getCheckoutSession(orderReference);
                
                if (sessionPayload) {
                    const empireUrl = (process.env.EMPIRE_BACKEND_API_URL || "http://empire.test").replace(/\/$/, "");
                    
                    try {
                        const isGuest = metadata.is_guest !== false && sessionPayload.customer_id === 0;
                        const endpoint = isGuest ? "/api/guest/orders" : "/api/account/orders";
                        
                        const headers: any = {
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        };
                        
                        if (!isGuest && sessionPayload.auth_token) {
                            headers["Authorization"] = `Bearer ${sessionPayload.auth_token}`;
                        }
                        
                        const payloadToSend = { 
                            status: isPaid ? "processing" : "failed",
                            email: sessionPayload.billing?.email
                        };
                        
                        await axios.patch(`${empireUrl}${endpoint}/${orderReference}/status`, payloadToSend, { headers });
                        
                        // Delete session once processed
                        await deleteCheckoutSession(orderReference);
                    } catch (empireError: any) {
                        console.error("Failed to update order status in Empire:", empireError?.response?.data || empireError.message);
                        return NextResponse.json({ message: "Empire API Error" }, { status: 500 });
                    }
                }
            }
            
            return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
        }

        // Fallback for old WooCommerce logic (while migrating)
        let newStatus = "";
        if (payment.status == 'paid') newStatus = "processing";
        else if (['canceled', 'expired'].includes(payment.status)) newStatus = "cancelled";
        else if (payment.status == 'failed') newStatus = "failed";

        if (newStatus) {
            const api = (await import("@/lib/woocommerce")).default;
            await api.put(`orders/${orderReference}`, {
                status: newStatus,
                transaction_id: payment.id,
            });
        }

        return NextResponse.json({ message: "Webhook received" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
