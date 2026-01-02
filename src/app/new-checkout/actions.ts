"use server";

import { getShippingSettings } from "@/lib/woocommerce";
import { createOrder } from "@/lib/woocommerce-order";

export async function getShippingRatesAction() {
    try {
        const rates = await getShippingSettings();
        return { success: true, ...rates };
    } catch (error) {
        console.error("Failed to fetch shipping rates:", error);
        return { success: false, flatRate: 0, freeShippingThreshold: null };
    }
}

export async function placeOrderAction(data: any) {
    try {
        const order = await createOrder(data.cart, data.billing);
        if (order && order.id) {
            return { success: true, orderId: order.id };
        }
        return { success: false, message: "Failed to create order" };
    } catch (error) {
        console.error("Failed to place order:", error);
        return { success: false, message: "An unexpected error occurred" };
    }
}
