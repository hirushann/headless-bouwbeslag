"use server";

import { getShippingSettings } from "@/lib/woocommerce";
import { createOrder } from "@/lib/woocommerce-order";

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
            // data.shipping_line should be passed to createOrder logic if updated
            return { success: true, data: order };
        }
        return { success: false, message: "Failed to create order" };
    } catch (error) {
        console.error("Failed to place order:", error);
        return { success: false, message: "An unexpected error occurred" };
    }
}
