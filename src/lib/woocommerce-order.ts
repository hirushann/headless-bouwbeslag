import api from "./woocommerce";

export async function createOrder(cart: any[], billing: any, shipping: any, shipping_lines: any[] = [], payment_method = "mollie", payment_method_title = "Mollie Payment", coupon_lines: any[] = [], customer_note = "") {
  try {
    const response = await api.post("orders", {
      payment_method,
      payment_method_title,
      set_paid: false,
      billing,
      shipping: shipping || billing, // Use shipping if provided, else billing
      customer_note,
      line_items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      shipping_lines,
      coupon_lines,
    });

    return response.data;
  } catch (error: any) {
    console.error("Order creation failed:", error.response?.data || error.message);
    return {};
  }
}