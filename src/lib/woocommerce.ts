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
        const namespace = endpoint.startsWith("wp/") || endpoint.startsWith("wc/") ? "" : `${this.version}/`;
        const requestUrl = new URL(`${this.url}/wp-json/${namespace}${endpoint}`);

        // Add Basic Auth
        const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);
        const headers: HeadersInit = {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
        };

        const params = isGet ? (data.params || data) : data;
        const revalidate = params?.next?.revalidate !== undefined ? params.next.revalidate : 60; // Lowered from 3600 to 60 for better responsiveness
        const cache = params?.cache;

        const config: any = {
            method,
            headers,
            next: { revalidate }
        };

        if (cache) {
            config.cache = cache;
            delete config.next; // cache and next.revalidate are mutually exclusive in fetch
        }

        if (isGet) {
            // Remove our custom options before appending to searchParams
            const filteredParams = { ...params };
            if (filteredParams.next) delete filteredParams.next;
            if (filteredParams.cache) delete filteredParams.cache;

            Object.keys(filteredParams).forEach((key) => {
                if (filteredParams[key] !== undefined && filteredParams[key] !== null) {
                    requestUrl.searchParams.append(key, String(filteredParams[key]));
                }
            });
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
        return {
            data: responseData,
            total: response.headers.get('x-wp-total'),
            totalPages: response.headers.get('x-wp-totalpages')
        };
    }

    get(endpoint: string, params: any = {}) {
        return this.request("GET", endpoint, params);
    }

    post(endpoint: string, data: any = {}) {
        return this.request("POST", endpoint, data);
    }

    put(endpoint: string, data: any = {}) {
        return this.request("PUT", endpoint, data);
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

export const fetchProducts = async (params: any = {}) => {
    try {
        const res = await api.get("products", {
            params: { ...params, status: 'publish' }
        });
        return res.data;
    } catch (error) {
        // console.error("Error fetching products:", error);
        return [];
    }
};

export const fetchCategories = async () => {
    const res = await api.get("products/categories", {
        params: { per_page: 100, _fields: "id,name,slug,parent" },
    });
    return res.data;
};

export const fetchMedia = async (id: number | string) => {
    const res = await api.get(`wp/v2/media/${id}`);
    return res.data;
};

// Helper to resolve brand logo if it's an ID
const resolveBrandLogin = async (brand: Brand): Promise<Brand> => {
    if (brand.acf?.brand_logo) {
        const logoId = Number(brand.acf.brand_logo);
        if (!isNaN(logoId) && logoId > 0) {
            try {
                const media = await fetchMedia(logoId);
                if (media?.source_url) {
                    brand.acf.brand_logo = media.source_url;
                }
            } catch (e) {
                // console.error(`Failed to resolve media for brand ${brand.name}`, e);
            }
        }
    }
    return brand;
}

export const getBrands = async (): Promise<Brand[]> => {
    try {
        let allBrands: Brand[] = [];
        let page = 1;
        let totalPages = 1;

        do {
            // Fetch from product_brand taxonomy (wp/v2 namespace)
            const response = await api.get("wp/v2/product_brand", {
                params: {
                    per_page: 100,
                    page: page,
                    hide_empty: true,
                    _embed: true,
                    next: { revalidate: 60 }
                }
            });

            const brands = response.data;
            if (!brands || brands.length === 0) break;

            allBrands = [...allBrands, ...brands];
            totalPages = Number(response.totalPages) || 1;
            page++;
        } while (page <= totalPages);

        // Resolve images in parallel
        const resolvedBrands = await Promise.all(allBrands.map((b: Brand) => resolveBrandLogin(b)));

        return resolvedBrands;
    } catch (error) {
        // console.error("Error fetching brands:", error);
        return [];
    }
};

export const getBrand = async (slug: string): Promise<Brand | null> => {
    try {
        const { data: brands } = await api.get("wp/v2/product_brand", {
            params: { slug: slug, _embed: true, next: { revalidate: 60 } }
        });

        if (brands.length > 0) {
            return await resolveBrandLogin(brands[0]);
        }
        return null;
    } catch (error) {
        return null;
    }
}

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

            availableMethods.push({
                id: method.instance_id,
                methodId: method.method_id,
                title: method.title,
                cost: cost,
                enabled: true,
                ...(method.method_id === "free_shipping" && {
                    requires: method.settings?.requires?.value,
                    minAmount: method.settings?.min_amount?.value
                })
            } as any);
        }

        return availableMethods;

    } catch (error) {
        // console.error("Error fetching shipping methods:", error);
        return [];
    }
};

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
        // console.error("Error fetching product stock:", error);
        return null;
    }
};

export const getCouponByCode = async (code: string) => {
    try {
        const { data } = await api.get("coupons", {
            params: { code: code },
        });
        return data && data.length > 0 ? data[0] : null;
    } catch (error) {
        // console.error("Error fetching coupon:", error);
        return null;
    }
};

// Brands
export interface Brand {
    id: number;
    name: string;
    slug: string;
    description: string;
    count: number;
    acf?: {
        brand_logo?: string | number | { url: string };
        brand_description?: string;
        brand_meta_title?: string;
        brand_meta_description?: string;
        faq_section?: { brand_faq_question: string; brand_faq_answer: string }[];
    };
    _embedded?: any;
}

export const getProductsByBrand = async (brandId: number): Promise<any[]> => {
    try {
        let allProducts: any[] = [];
        let page = 1;
        let totalPages = 1;

        // 1. Fetch all product IDs for this brand from WP Core endpoint
        do {
            const response = await api.get("wp/v2/product", {
                params: {
                    product_brand: brandId,
                    per_page: 100, // Max allowed by WP
                    page: page,
                    _fields: 'id',
                    next: { revalidate: 60 } // Lower revalidate for better updates
                }
            });

            const wpProducts = response.data;
            if (!wpProducts || wpProducts.length === 0) break;

            const ids = wpProducts.map((p: any) => p.id);

            // 2. Fetch full product details for these IDs from WC API
            const { data: wcProducts } = await api.get("products", {
                params: {
                    include: ids.join(','),
                    per_page: 100,
                    status: 'publish',
                    next: { revalidate: 60 }
                }
            });

            allProducts = [...allProducts, ...wcProducts];
            totalPages = Number(response.totalPages) || 1;
            page++;
        } while (page <= totalPages);

        return allProducts;

    } catch (error) {
        // console.error("Error fetching brand products:", error);
        return [];
    }
};


export const fetchAllWoo = async (endpoint: string, extraParams: any = {}) => {
    let page = 1;
    const allItems: any[] = [];

    while (true) {
        try {
            const res = await api.get(endpoint, {
                params: {
                    per_page: 50, // Reduced from 100 to avoid cache limits
                    page,
                    cache: "no-store", // Disable cache to prevent 2MB warnings
                    ...extraParams,
                }
            });

            const data = Array.isArray(res?.data) ? res.data : [];
            if (!data.length) break;

            allItems.push(...data);
            page++;

            // Safety break to prevent infinite loops (max 5000 items)
            if (page > 50) break;
        } catch (e: any) {
            // console.error(`Error fetching page ${page} of ${endpoint}:`, e.message);
            break;
        }
    }

    return allItems;
};

export default api;
