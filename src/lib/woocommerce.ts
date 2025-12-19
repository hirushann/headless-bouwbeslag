const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string;
const CK = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY as string;
const CS = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET as string;

class WooCommerceClient {
  private url: string;
  private consumerKey: string;
  private consumerSecret: string;
  private version: string;

  constructor(config: { url: string; consumerKey: string; consumerSecret: string; version: string }) {
    this.url = config.url;
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.version = config.version;
  }

  private async request(method: string, endpoint: string, data: any = {}) {
    const isGet = method === "GET";
    const requestUrl = new URL(`${this.url}/wp-json/${this.version}/${endpoint}`);

    // Add Basic Auth
    const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);
    const headers: HeadersInit = {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (isGet) {
      const params = data.params || data;
      if (params) {
        Object.keys(params).forEach((key) => {
          if (params[key] !== undefined && params[key] !== null) {
            requestUrl.searchParams.append(key, String(params[key]));
          }
        });
      }
    } else {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(requestUrl.toString(), config);
    if (!response.ok) {
      // Try to parse error message if available
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || response.statusText);
    }
    const responseData = await response.json();
    return { data: responseData }; // Match the response structure of the original library
  }

  get(endpoint: string, params: any = {}) {
    return this.request("GET", endpoint, params);
  }

  post(endpoint: string, data: any = {}) {
    return this.request("POST", endpoint, data);
  }
}

const api = new WooCommerceClient({
  url: WP_API_URL,
  consumerKey: CK,
  consumerSecret: CS,
  version: "wc/v3",
});

export const fetchPosts = async (perPage: number = 5) => {
  const res = await api.get("posts", {
    params: { per_page: perPage, _embed: true },
  });
  return res.data;
};

export const fetchCategories = async () => {
  const res = await api.get("products/categories", {
    params: { per_page: 100, _fields: "id,name,slug,parent" },
  });
  return res.data;
};

export const fetchMedia = async (id: number | string) => {
  const res = await api.get(`media/${id}`);
  return res.data;
};

export const getShippingSettings = async () => {
  try {
    const { data: zones } = await api.get("shipping/zones", { _fields: "id,name" });

    // Prioritize "Netherlands" or "Nederland" zone if it exists
    const nlZone = zones.find((z: any) => z.name.toLowerCase() === "nederland" || z.name.toLowerCase() === "netherlands");

    // Otherwise find the first defined zone (usually ID > 0). 
    const primaryZone = nlZone || zones.find((z: any) => z.id !== 0) || zones[0];
    const zoneId = primaryZone?.id || 0;

    // Fetch methods with no-store cache to ensure fresh settings
    // Note: Since `api.get` uses `fetch` internally, we need to ensure it doesn't cache if we can't pass config.
    // Given the current class, we can't easily pass cache config without refactoring.
    // However, we can append a timestamp to the URL to bust cache if needed, or rely on Next.js 15 semantic if applicable.
    // For now, let's keep the fetch simple but improve zone selection.

    const { data: methods } = await api.get(
      `shipping/zones/${zoneId}/methods`
    );

    let flatRate: number | null = null;
    let freeShippingThreshold: number | null = null;

    for (const method of methods) {
      if (!method.enabled) continue;

      // Check for Flat Rate (Take the first one found as it's the highest priority)
      if (method.method_id === "flat_rate" && flatRate === null) {
        const cost = parseFloat(method.settings.cost?.value || "0");
        if (!isNaN(cost)) {
          flatRate = cost;
        }
      }

      // Check for Free Shipping
      // Respect 'requires' setting: '' (N/A), 'coupon', 'min_amount', 'either', 'both'
      if (method.method_id === "free_shipping" && freeShippingThreshold === null) {
        const requires = method.settings.requires?.value || "";
        const minAmountVal = parseFloat(method.settings.min_amount?.value || "0");
        const minAmount = isNaN(minAmountVal) ? 0 : minAmountVal;

        if (requires === "" || requires === "min_amount" || requires === "either") {
          // If requires is empty (N/A), it means unconditional free shipping (threshold 0)
          // If requires is min_amount or either, we respect the amount
          freeShippingThreshold = requires === "" ? 0 : minAmount;
        }
        // If requires is 'coupon' or 'both', we ignore it for now as we don't check coupons yet
      }
    }

    // Fallback: if no flat rate found, default to 0
    return { flatRate: flatRate ?? 0, freeShippingThreshold };
  } catch (error) {
    console.error("Error fetching shipping settings:", error);
    return { flatRate: 0, freeShippingThreshold: null };
  }
};


export const fetchProductStock = async (id: number) => {
  try {
    const res = await api.get(`products/${id}`, {
      params: { _fields: "id,stock_quantity,stock_status,manage_stock,backorders,backorders_allowed" }
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching product stock:", error);
    return null;
  }
};

export default api;