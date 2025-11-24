import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://dayzsolutions.com/empire",
  consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY as string,
  consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET as string,
  version: "wc/v3",
});

export default api;