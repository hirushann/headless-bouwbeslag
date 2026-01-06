"use server";

import { getShippingSettings } from "@/lib/woocommerce";
import { createOrder } from "@/lib/woocommerce-order";
import mollieClient from "@/lib/mollie";
import { redirect } from "next/navigation";


export async function getShippingRatesAction() {
    try {
        const rates = await getShippingSettings();
        // rates is now ShippingMethod[]
        return { success: true, methods: rates };
    } catch (error) {
        console.error("Failed to fetch shipping rates:", error);
        return { success: false, methods: [] };
    }
}

export async function placeOrderAction(data: any) {
    try {
        const order = await createOrder(data.cart, data.billing, data.shipping_line);
        if (order && order.id) {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const isLocal = siteUrl.includes('localhost');

            // Mollie webhook must be reachable. If local, we omit it or need ngrok.
            // For now, if local, we omit it so payment creation succeeds (but status won't update automatically).
            const webhookUrl = isLocal ? undefined : `${siteUrl}/api/webhooks/mollie`;

            // Create Mollie Payment
            const payment = await mollieClient.payments.create({
                amount: {
                    currency: "EUR",
                    value: parseFloat(order.total).toFixed(2),
                },
                description: `Order #${order.id}`,
                redirectUrl: `${siteUrl}/checkout/success?orderId=${order.id}`,
                webhookUrl: webhookUrl,
                metadata: {
                    order_id: order.id,
                },
            });

            if (payment && payment._links.checkout) {
                return { success: true, redirectUrl: payment._links.checkout.href };
            }

            return { success: true, data: order };
        }
        return { success: false, message: "Failed to create order" };
    } catch (error: any) {
        console.error("Failed to place order:", error);
        // Return the actual error message for debugging
        return { success: false, message: error.message || "An unexpected error occurred" };
    }
}
