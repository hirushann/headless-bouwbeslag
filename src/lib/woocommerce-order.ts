import api from "./woocommerce";

export async function createOrder(cart: any[], billing: any, shipping_lines: any[] = [], payment_method = "mollie", payment_method_title = "Mollie Payment") {
  try {
    const response = await api.post("orders", {
      payment_method,
      payment_method_title,
      set_paid: false,
      billing,
      shipping: billing,
      line_items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      shipping_lines,
    });

    return response.data;
  } catch (error: any) {
    console.error("Order creation failed:", error.response?.data || error.message);
    return {};
  }
}