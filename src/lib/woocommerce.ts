const WP_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string;
const CK = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY as string;
const CS = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET as string;

export class WooCommerceClient {
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

export interface ShippingMethod {
  id: number;
  methodId: string;
  title: string;
  cost: number;
  enabled: boolean;
}

export const getShippingMethods = async () => {
  try {
    const { data: zones } = await api.get("shipping/zones", { _fields: "id,name" });
    const nlZone = zones.find((z: any) => z.name.toLowerCase() === "nederland" || z.name.toLowerCase() === "netherlands");
    const primaryZone = nlZone || zones.find((z: any) => z.id !== 0) || zones[0];
    const zoneId = primaryZone?.id || 0;

    const { data: methods } = await api.get(`shipping/zones/${zoneId}/methods`);

    const availableMethods: ShippingMethod[] = [];

    for (const method of methods) {
      if (!method.enabled) continue;

      let cost = 0;

      if (method.method_id === "flat_rate") {
        const val = parseFloat(method.settings.cost?.value || "0");
        cost = isNaN(val) ? 0 : val;
      } else if (method.method_id === "local_pickup") {
        const val = parseFloat(method.settings.cost?.value || "0");
        cost = isNaN(val) ? 0 : val;
      }
      // Free shipping usually has cost 0, or requires logic. 
      // For simplicity, if it's enabled passed from WP, we assume it's available to be picked.
      // However, WP API usually returns ALL methods in the zone, regardless of cart rules (min amount).
      // Logic for "min amount" validation usually happens on the server (Cart) or we need to replicate it.
      // The previous code checked settings for min_amount.

      // IMPROVEMENT: We should return the min_amount requirement for free_shipping so the frontend can validate it against cart total.
      // But user wanted "Fully Dynamic". 
      // If we just list them, "Free Shipping" might show up even if cart is empty if we don't check.
      // The WP API `methods` endpoint lists configured methods, not "validated against current cart".

      // To strictly follow "Dynamic", we returned the settings. 
      // Let's attach the logic.

      availableMethods.push({
        id: method.instance_id,
        methodId: method.method_id,
        title: method.title,
        cost: cost,
        enabled: true,
        // We might need extra data for free shipping validation
        ...(method.method_id === "free_shipping" && {
          requires: method.settings?.requires?.value,
          minAmount: method.settings?.min_amount?.value
        })
      } as any);
    }

    return availableMethods;

  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return [];
  }
};
// Keeping old function for compatibility if needed, but the plan replaces it.
// Actually, I will replace getShippingSettings with this new logic but keep the name to avoid breaking imports if I want, 
// OR I can export this as new and update imports.
// Plan said: Update getShippingSettings. I will replace it.

export const getShippingSettings = async () => {
  return getShippingMethods();
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