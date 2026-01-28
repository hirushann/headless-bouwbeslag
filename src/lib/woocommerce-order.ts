import api from "./woocommerce";

export async function createOrder(
  cart: any[],
  billing: any,
  shipping: any,
  shipping_lines: any[] = [],
  payment_method = "mollie",
  payment_method_title = "Mollie Payment",
  coupon_lines: any[] = [],
  customer_note = "",
  customer_id = 0,
  fee_lines: any[] = []
) {
  try {
    console.log("📤 Sending to WooCommerce API:", JSON.stringify({
      payment_method,
      billing,
      shipping: shipping || billing,
      line_items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity })),
      shipping_lines,
      fee_lines
    }, null, 2));

    const response = await api.post("orders", {
      payment_method,
      payment_method_title,
      set_paid: false,
      billing,
      shipping: shipping || billing,
      customer_note,
      customer_id,
      line_items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        subtotal: item.price.toString(),
        total: item.price.toString(),
      })),
      shipping_lines,
      coupon_lines,
      fee_lines,
    });

    return response.data;
  } catch (error: any) {
    console.error("Order creation failed:", error.response?.data || error.message);
    return {};
  }
}

export async function getOrder(id: number | string) {
  try {
    const response = await api.get(`orders/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch order ${id}:`, error.response?.data || error.message);
    return null;
  }
}

export async function updateOrder(id: number | string, data: any) {
  try {
    const response = await api.put(`orders/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update order ${id}:`, error.response?.data || error.message);
    return null;
  }
}