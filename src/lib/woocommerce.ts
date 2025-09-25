import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_URL || "http://staging-plugin-test.test",
  consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || "ck_5b77f247ad57bb0ced440b3df6a1df1809f5ada2",
  consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || "cs_2a6b63ee562762ba8a129d8eedc9974d83f66443",
  version: "wc/v3",
});

export default api;