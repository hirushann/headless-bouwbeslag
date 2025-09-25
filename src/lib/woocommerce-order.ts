import api from "./woocommerce";

export async function createOrder(cart: any[], billing: any) {
  try {
    const response = await api.post("orders", {
      payment_method: "bacs",
      payment_method_title: "Bank Transfer",
      set_paid: false,
      billing,
      shipping: billing,
      line_items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    });

    return response.data;
  } catch (error: any) {
    console.error("Order creation failed:", error.response?.data || error.message);
    return {};
  }
}