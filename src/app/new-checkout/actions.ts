"use server";

import { getShippingSettings, getCouponByCode } from "@/lib/woocommerce";
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

export async function validateCouponAction(
    code: string,
    cartTotal: number = 0,
    cartItems: { product_id: number }[] = [],
    email: string = ""
) {
    try {
        console.log(`Validating coupon '${code}'. Total: ${cartTotal}, Items: ${cartItems.length}, Email: ${email}`);

        const coupon = await getCouponByCode(code);

        if (!coupon) {
            console.log("Coupon not found");
            return { success: false, message: "Invalid coupon code" };
        }

        console.log("Coupon details:", {
            id: coupon.id,
            code: coupon.code,
            min: coupon.minimum_amount,
            max: coupon.maximum_amount,
            expiry: coupon.date_expires,
            product_ids: coupon.product_ids
        });

        // 1. Expiry Check
        if (coupon.date_expires) {
            const expiry = new Date(coupon.date_expires);
            if (expiry < new Date()) {
                return { success: false, message: "Coupon has expired" };
            }
        }

        // 2. Usage Limit Check
        const usageLimit = parseInt(String(coupon.usage_limit || 0));
        const usageCount = parseInt(String(coupon.usage_count || 0));

        if (usageLimit > 0 && usageCount >= usageLimit) {
            return { success: false, message: "Coupon usage limit reached" };
        }

        // 3. Minimum Spend Check
        const minAmount = parseFloat(String(coupon.minimum_amount || "0"));
        if (minAmount > 0) {
            if (cartTotal < minAmount) {
                return { success: false, message: `Minimum spend of €${minAmount.toFixed(2)} required` };
            }
        }

        // 4. Maximum Spend Check
        const maxAmount = parseFloat(String(coupon.maximum_amount || "0"));
        if (maxAmount > 0) {
            if (cartTotal > maxAmount) {
                return { success: false, message: `Maximum spend of €${maxAmount.toFixed(2)} exceeded` };
            }
        }

        // 5. Email Restrictions Check
        if (coupon.email_restrictions && coupon.email_restrictions.length > 0) {
            if (!email) {
                return { success: false, message: "This coupon is restricted to specific emails. Please enter your email." };
            }
            const allowedEmails = coupon.email_restrictions;
            if (!allowedEmails.includes(email)) {
                return { success: false, message: "This coupon is not valid for your email address" };
            }
        }

        // 6. Product Inclusion Check
        if (coupon.product_ids && coupon.product_ids.length > 0) {
            const couponProductIds = coupon.product_ids.map((id: any) => Number(id));
            const cartProductIds = cartItems.map((item: any) => Number(item.product_id));

            const hasIncludedProduct = cartProductIds.some((id: number) => couponProductIds.includes(id));
            if (!hasIncludedProduct) {
                return { success: false, message: "This coupon is not valid for the items in your cart" };
            }
        }

        // 7. Product Exclusion Check
        if (coupon.excluded_product_ids && coupon.excluded_product_ids.length > 0) {
            const couponExcludedIds = coupon.excluded_product_ids.map((id: any) => Number(id));
            const cartProductIds = cartItems.map((item: any) => Number(item.product_id));

            const hasExcludedProduct = cartProductIds.some((id: number) => couponExcludedIds.includes(id));
            if (hasExcludedProduct) {
                return { success: false, message: "This coupon cannot be used with some items in your cart" };
            }
        }

        return { success: true, coupon };
    } catch (error) {
        console.error("Failed to validate coupon:", error);
        return { success: false, message: "Error validating coupon" };
    }
}

export async function getPaymentMethodsAction() {
    try {
        const methods = await mollieClient.methods.list();
        // Map to serializable object
        const serializableMethods = methods.map((m: any) => ({
            id: m.id,
            description: m.description,
            image: m.image
        }));
        return { success: true, methods: serializableMethods };
    } catch (error) {
        console.error("Failed to fetch payment methods:", error);
        // Fallback to empty list, UI handles it
        return { success: false, methods: [] };
    }
}

export async function placeOrderAction(data: any) {
    try {
        const order = await createOrder(
            data.cart,
            data.billing,
            data.shipping, // Pass separate shipping object
            data.shipping_line,
            "mollie",
            "Mollie Payment",
            data.coupon_lines,
            data.customer_note // Pass customer note
        );
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
                method: data.mollie_method_id, // Pass selected method to Mollie
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

import axios from "axios";

export async function checkPostcodeAction(postcode: string, number: string) {
    try {
        console.log(`Checking postcode with Axios: ${postcode}, number: ${number}`);

        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://postcode.tech/api/v1/postcode/full?postcode=${postcode}&number=${number}`,
            headers: {
                'Authorization': 'Bearer 835ceb49-49af-4ed2-82a9-409ff9f7248d'
            }
        };

        const response = await axios.request(config);

        return { success: true, data: response.data };
    } catch (error: any) {
        console.error("Failed to check postcode (Axios):", error.message);
        if (error.response) {
            console.error("Error response status:", error.response.status);
            console.error("Error response data:", JSON.stringify(error.response.data));
            if (error.response.status === 404) {
                return { success: false, message: "Address not found" };
            }
        }
        return { success: false, message: error.message };
    }
}

import { validateVatEU } from "@salespark/validate-vat-eu";

export async function validateVatAction(vatNumber: string) {
    try {
        // Extract country code (first 2 chars) usually. Or just assume it's in the string.
        // The library might want country code separate?
        // Let's check if the first 2 chars are letters.
        const countryCode = vatNumber.substring(0, 2).toUpperCase();
        const number = vatNumber.substring(2);

        // Pass country code and number separately if needed, or check docs. 
        // Based on "Expected 2-3 arguments", it probably wants (countryCode, vatNumber, [options]).
        const result = await validateVatEU(countryCode, number);
        if (result) {
            return { success: true, valid: true, data: result }; // Assuming library returns boolean or object
        } else {
            return { success: true, valid: false, message: "Ongeldig BTW-nummer" };
        }
    } catch (error: any) {
        console.error("VAT Validation Failed:", error);
        return { success: false, message: "Kon BTW-nummer niet controleren. Probeer het later opnieuw." };
    }
}
