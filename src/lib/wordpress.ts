import { WooCommerceClient } from "./woocommerce";

const CK = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY as string;
const CS = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET as string;
const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string;

// Initialize the client for WP V2 endpoints
export const wpApi = new WooCommerceClient({
  url: WP_API_URL,
  consumerKey: CK,
  consumerSecret: CS,
  version: "wp/v2",
});

export const fetchPosts = async (perPage: number = 5) => {
  const res = await wpApi.get("posts", { per_page: perPage, _embed: true });
  return res.data;
};

export const fetchCategories = async () => {
  const res = await wpApi.get("categories", { per_page: 100, _fields: "id,name,slug" });
  return res.data;
};

export const fetchMedia = async (id: number | string) => {
  try {
    const res = await wpApi.get(`media/${id}`);
    console.log("🟦 Media data for ID " + id + ":", res.data);
    return res.data;
  } catch (error) {
    console.error(`Error fetching media ${id}:`, error);
    // Explicitly return null if 401 or other errors occur, to avoid crashing
    return null;
  }
};