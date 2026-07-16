"use server";

import { getShippingSettings, getCouponByCode, getShippingRules } from "@/lib/woocommerce";
import { getCheckoutSession, saveCheckoutSession, deleteCheckoutSession } from "@/lib/checkout-session";
import mollieClient from "@/lib/mollie";
import { redirect } from "next/navigation";
import axios from "axios";
import { getOrder, updateOrder } from "@/lib/woocommerce-order";


export async function checkOrderStatusAction(orderId: string | number) {
    try {
        const orderIdStr = String(orderId);
        
        // New Flow (Session-based)
        if (orderIdStr.startsWith("BW-") || orderIdStr.startsWith("NEXT-")) {
            try {
                const session = await getCheckoutSession(orderIdStr);
                if (!session) {
                    return { success: true, status: 'processing' };
                }
                
                if (session.transaction_id) {
                    const payment = await mollieClient.payments.get(session.transaction_id);
                    if (payment.status === 'paid') {
                        const empireUrl = (process.env.EMPIRE_BACKEND_API_URL || "http://empire.test").replace(/\/$/, "");
                        const isGuest = session.customer_id === 0;
                        const endpoint = isGuest ? "/api/guest/orders" : "/api/account/orders";
                        
                        const headers: any = { "Accept": "application/json", "Content-Type": "application/json" };
                        if (!isGuest && session.auth_token) {
                            headers["Authorization"] = `Bearer ${session.auth_token}`;
                        }
                        
                        const payloadToSend = { ...session, status: 'processing' };
                        delete payloadToSend.auth_token;
                        
                        try {
                            await axios.post(`${empireUrl}${endpoint}`, payloadToSend, { headers });
                            await deleteCheckoutSession(orderIdStr);
                            return { success: true, status: 'processing' };
                        } catch (e: any) {
                            console.error("Empire API Error in success check:", e?.response?.data || e.message);
                            return {
                                success: false,
                                status: 'backend_failed',
                                message: "De betaling is gelukt, maar de bestelling kon niet worden aangemaakt. Neem contact op met de klantenservice en vermeld je ordernummer."
                            };
                        }
                    } else if (['canceled', 'expired', 'failed'].includes(payment.status)) {
                        await deleteCheckoutSession(orderIdStr);
                        return { success: true, status: payment.status === 'canceled' ? 'cancelled' : 'failed' };
                    }
                    return { success: true, status: 'pending' };
                }
                
                return { success: true, status: 'pending' };
            } catch (innerError: any) {
                console.error("Inner Error in checkOrderStatusAction:", innerError);
                return { success: false, message: "Error checking status: " + innerError.message };
            }
        }

        // Old WooCommerce flow fallback
        const order = await getOrder(Number(orderId));
        if (!order) return { success: false, message: "Order not found" };

        if ((order.status === 'pending' || order.status === 'pending-payment') && order.transaction_id) {
            const payment = await mollieClient.payments.get(order.transaction_id);
            if (payment.status === 'paid') {
                await updateOrder(Number(orderId), { status: 'processing', set_paid: true });
                order.status = 'processing';
            }
        }
        return { success: true, status: order.status, orderKey: order.order_key, total: order.total };
    } catch (error) {
        return { success: false, message: "Error checking status" };
    }
}

export async function verifyPaymentStatusAction(orderId: string | number) {
    return checkOrderStatusAction(orderId);
}


export async function getShippingRatesAction() {
    try {
        const rates = await getShippingSettings();
        // rates is now ShippingMethod[]
        return { success: true, methods: rates };
    } catch (error) {
        // console.error("Failed to fetch shipping rates:", error);
        return { success: false, methods: [] };
    }
}

export async function getShippingRulesAction() {
    try {
        const rules = await getShippingRules();
        return { success: true, rules };
    } catch (error) {
        return { success: false, rules: [] };
    }
}

export async function validateCouponAction(
    code: string,
    cartTotal: number = 0,
    cartItems: { product_id: number }[] = [],
    email: string = ""
) {
    try {
        // console.log(`Validating coupon '${code}'. Total: ${cartTotal}, Items: ${cartItems.length}, Email: ${email}`);

        const coupon = await getCouponByCode(code);

        if (!coupon) {
            // console.log("Coupon not found");
            return { success: false, message: "Invalid coupon code" };
        }

        // console.log("Coupon details:", {
        //     id: coupon.id,
        //     code: coupon.code,
        //     min: coupon.minimum_amount,
        //     max: coupon.maximum_amount,
        //     expiry: coupon.date_expires,
        //     product_ids: coupon.product_ids
        // });

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
        // console.error("Failed to validate coupon:", error);
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
        // console.error("Failed to fetch payment methods:", error);
        // Fallback to empty list, UI handles it
        return { success: false, methods: [] };
    }
}

export async function placeOrderAction(data: any) {
    try {
        const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, "");
        const taxRate = 0.21;
        const taxMultiplier = 1 + taxRate;
        const pricesIncludeTax = data.prices_include_tax !== false;
        const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
        
        // Generate a unique order reference
        const orderReference = `BW-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

        // Calculate totals for Empire Payload
        const shippingLine = data.shipping_line?.[0];
        const shippingTotalExTax = shippingLine ? parseFloat(shippingLine.total) : 0;
        const shippingTotal = pricesIncludeTax ? roundMoney(shippingTotalExTax * taxMultiplier) : roundMoney(shippingTotalExTax);
        const shippingTax = roundMoney(shippingTotal - shippingTotalExTax);
        
        let subtotal = 0;
        
        // Ensure all items have a valid SKU (especially old cart items missing the sku field)
        const itemsToProcess = [...data.cart];
        const missingSkuItems = itemsToProcess.filter((item: any) => !item.sku && !item.sync_id && !isNaN(Number(item.id)));
        
        if (missingSkuItems.length > 0) {
            const idsToFetch = missingSkuItems.map((item: any) => item.id).join(",");
            try {
                // Quick fetch from WooCommerce to get missing SKUs
                const { default: api } = await import("@/lib/woocommerce");
                const res = await api.get("products", { include: idsToFetch, _fields: "id,sku", per_page: 100 });
                if (Array.isArray(res.data)) {
                    res.data.forEach((p: any) => {
                        const target = itemsToProcess.find((item: any) => Number(item.id) === Number(p.id));
                        if (target && p.sku) {
                            target.sku = p.sku;
                        }
                    });
                }
            } catch (e) {
                // console.error("Failed to fetch missing SKUs", e);
            }
        }

        const items = itemsToProcess.map((item: any) => {
            const price = parseFloat(item.price || 0);
            const qty = parseInt(item.quantity || 1);
            const invoicePrice = pricesIncludeTax ? roundMoney(price * taxMultiplier) : roundMoney(price);
            const syncId = item.sync_id || item.sku;
            const sku = item.sku || item.sync_id;

            if (!syncId && !sku) {
                throw new Error(`Product "${item.name || item.id}" mist een SKU en kan niet worden besteld.`);
            }

            subtotal += (price * qty);
            
            return {
                sync_id: syncId,
                sku: sku, 
                name: item.name,
                quantity: qty,
                price: invoicePrice,
                price_ex_tax: roundMoney(price),
                price_tax: pricesIncludeTax ? roundMoney((price * taxMultiplier) - price) : 0,
                manual_unit_price: invoicePrice
            };
        });

        // Add fee lines to total calculation
        let totalFees = 0;
        const feeLines = (data.fee_lines || []).map((fee: any) => {
            const feeTotalExTax = parseFloat(fee.total || 0);
            totalFees += feeTotalExTax;

            return {
                ...fee,
                total: pricesIncludeTax
                    ? roundMoney(feeTotalExTax * taxMultiplier).toFixed(2)
                    : roundMoney(feeTotalExTax).toFixed(2),
                total_ex_tax: roundMoney(feeTotalExTax),
                total_tax: pricesIncludeTax ? roundMoney((feeTotalExTax * taxMultiplier) - feeTotalExTax) : 0
            };
        });

        let discount = 0;
        if (data.coupon_lines && data.coupon_lines.length > 0) {
            const couponCode = data.coupon_lines[0].code;
            const coupon = await getCouponByCode(couponCode);
            if (coupon) {
                if (coupon.discount_type === 'percent') {
                    const amount = parseFloat(coupon.amount || "0");
                    discount = (subtotal * amount) / 100;
                } else if (coupon.discount_type === 'fixed_cart') {
                    const amount = parseFloat(coupon.amount || "0");
                    // Assuming amount is gross (Inc VAT), we need Ex VAT amount to deduct
                    discount = amount / 1.21;
                }
            }
        }

        const netTotal = subtotal - discount + shippingTotalExTax + totalFees;
        const totalTax = netTotal * taxRate;
        const totalAmount = Math.max(netTotal + totalTax, 0); // Ensure total is never negative

        // Build Empire API payload
        const empirePayload: Record<string, any> = {
            website_url: "https://bouwbeslag.nl",
            order_reference: orderReference,
            status: "processing", // Status to set when payment completes
            billing: data.billing,
            shipping: data.shipping,
            items: items,
            shipping_total: shippingTotal,
            shipping_total_ex_tax: roundMoney(shippingTotalExTax),
            shipping_tax: shippingTax,
            subtotal_ex_tax: roundMoney(subtotal),
            prices_include_tax: pricesIncludeTax,
            total: totalAmount,
            total_tax: totalTax,
            payment_method: data.mollie_method_id || "mollie",
            payment_method_title: "Mollie",
            customer_note: data.customer_note || "",
            eu_vat_number: data.meta_data?.find((m: any) => m.key === "vat_number")?.value || "",
            customer_id: data.customer_id,
            auth_token: data.auth_token || "",
            coupon_lines: data.coupon_lines || [],
            fee_lines: feeLines,
            discount_total: pricesIncludeTax ? roundMoney(discount * taxMultiplier) : roundMoney(discount),
            discount_total_ex_tax: roundMoney(discount),
            discount_tax: pricesIncludeTax ? roundMoney((discount * taxMultiplier) - discount) : 0
        };


        empirePayload.status = "pending";
        const empireUrl = (process.env.EMPIRE_BACKEND_API_URL || "http://empire.test").replace(/\/$/, "");
        const isGuest = !data.customer_id;
        const endpoint = isGuest ? "/api/guest/orders" : "/api/account/orders";
        
        const headers: any = {
            "Accept": "application/json",
            "Content-Type": "application/json"
        };
        
        if (!isGuest && data.auth_token) {
            headers["Authorization"] = `Bearer ${data.auth_token}`;
        }

        // Delete order_reference so the backend generates a sequential one
        const payloadToSend = { ...empirePayload };
        delete payloadToSend.auth_token;
        delete payloadToSend.order_reference;

        const axios = require('axios');
        let finalOrderReference = empirePayload.order_reference; // Fallback to the temp one initially
        
        try {
            const response = await axios.post(`${empireUrl}${endpoint}`, payloadToSend, { headers });
            if (response.data && response.data.data && response.data.data.order_reference) {
                finalOrderReference = response.data.data.order_reference;
                empirePayload.order_reference = finalOrderReference;
            }
        } catch (empireError: any) {
            console.error("Failed to push order to Empire:", empireError?.response?.data || empireError.message);
            return { success: false, message: "Failed to create order in backend" };
        }

        // Save session locally AFTER we have the final order reference from backend
        await saveCheckoutSession(finalOrderReference, empirePayload);

        // Mollie webhook must be reachable. If local, omit it or use ngrok.
        const isLocal = siteUrl.includes('localhost');
        const webhookUrl = isLocal ? undefined : `${siteUrl}/api/webhooks/mollie`;

        const paymentValue = totalAmount.toFixed(2);

        // Create Mollie Payment
        const payment = await mollieClient.payments.create({
            amount: {
                currency: "EUR",
                value: paymentValue,
            },
            description: `Order ${finalOrderReference}`,
            redirectUrl: `${siteUrl}/checkout/success?orderId=${finalOrderReference}`,
            webhookUrl: webhookUrl,
            metadata: {
                order_reference: finalOrderReference,
                is_guest: !data.customer_id
            },
            method: data.mollie_method_id, 
        });


        // Update session with transaction_id so checkOrderStatus can find it
        if (payment && payment.id) {
            empirePayload.transaction_id = payment.id;
            await saveCheckoutSession(finalOrderReference, empirePayload);
            // Optionally PATCH empire here with transaction_id, but webhook will handle status
        }


        if (payment && payment._links.checkout) {
            return { success: true, redirectUrl: payment._links.checkout.href };
        }
        
        return { success: false, message: "Failed to create Mollie payment" };
    } catch (error: any) {
        return { success: false, message: error.message || "An unexpected error occurred" };
    }
}



export async function checkPostcodeAction(postcode: string, number: string) {
    try {
        // console.log(`Checking postcode with Axios: ${postcode}, number: ${number}`);

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
        // console.error("Failed to check postcode (Axios):", error.message);
        if (error.response) {
            // console.error("Error response status:", error.response.status);
            // console.error("Error response data:", JSON.stringify(error.response.data));
            if (error.response.status === 404) {
                return { success: false, message: "Address not found" };
            }
        }
        return { success: false, message: error.message };
    }
}



export async function validateVatAction(vatNumber: string) {
    try {
        // Sanitize the input to strip any spaces, dots, or dashes
        const cleanVat = vatNumber.replace(/[\s\-\.]/g, '').toUpperCase();
        
        if (cleanVat.length < 3) {
            return { success: true, valid: false, message: "BTW-nummer is te kort" };
        }

        // Extract country code (first 2 chars) and numeric payload
        const countryCode = cleanVat.substring(0, 2);
        const number = cleanVat.substring(2);

        if (!number) {
            return { success: true, valid: false, message: "BTW-nummer ontbreekt na landcode" };
        }

        const response = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${number}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store' // Avoid caching validation results
        });

        if (!response.ok) {
            return { success: false, message: `Verificatie service onbereikbaar (${response.status})` };
        }

        const data = await response.json();
        
        if (data && typeof data.isValid === 'boolean') {
            return { success: true, valid: data.isValid, data: data };
        } else {
            return { success: true, valid: false, message: "Verificatie service gaf een onbekende reactie" };
        }
    } catch (error: any) {
        return { success: false, message: `Verificatie mislukt: ${error.message}` };
    }
}
