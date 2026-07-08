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
        const revalidate = params?.next?.revalidate !== undefined ? params.next.revalidate : 3600; // Increased default to 1 hour
        const cache = params?.cache;

        const config: any = {
            method,
            headers,
        };

        if (params?.next) {
            config.next = params.next;
        } else if (cache) {
            config.cache = cache;
        } else {
            config.next = { revalidate: 3600 };
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

const EMPIRE_API_URL = process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test";
const EMPIRE_BASE_URL = EMPIRE_API_URL.replace(/\/$/, "");

export const fetchCategories = async () => {
    try {
        const res = await fetch(`${EMPIRE_BASE_URL}/api/categories`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        return [];
    }
};

export const fetchMedia = async (id: number | string) => {
    const res = await api.get(`wp/v2/media/${id}`);
    return res.data;
};

// Helper to resolve brand logo if it's an ID or native WC
const resolveBrandLogo = async (brand: Brand): Promise<Brand> => {
    // 1. Check native WooCommerce Brand image first (Most reliable)
    try {
        const wcBrandRes = await api.get(`products/brands/${brand.id}`, { next: { revalidate: 3600 } });
        if (wcBrandRes.data?.image?.src) {
            if (!brand.acf) brand.acf = {};
            brand.acf.brand_logo = wcBrandRes.data.image.src;
            return brand;
        }
    } catch (e) {
        // Fallback to ACF
    }

    // 2. Fallback to ACF if native WC image is missing
    if (brand.acf?.brand_logo) {
        const logoId = Number(brand.acf.brand_logo);
        if (!isNaN(logoId) && logoId > 0) {
            try {
                // Add caching to media lookup
                const mediaRes = await api.get(`wp/v2/media/${logoId}`, { next: { revalidate: 3600 } });
                if (mediaRes.data?.source_url) {
                    brand.acf.brand_logo = mediaRes.data.source_url;
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
        const res = await fetch(`${EMPIRE_BASE_URL}/api/brands`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        return [];
    }
};

export const getBrand = async (slug: string): Promise<Brand | null> => {
    try {
        const res = await fetch(`${EMPIRE_BASE_URL}/api/brands/${slug}`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return null;
        const brands = await res.json();
        return brands.length > 0 ? brands[0] : null;
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
        const res = await fetch(`${EMPIRE_BASE_URL}/api/shipping/settings`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        
        const methods = await res.json();
        
        return methods.map((m: any) => ({
            id: m.method_id,
            methodId: m.method_id,
            title: m.title,
            cost: m.cost || 0,
            enabled: m.enabled,
            requires: m.min_amount ? "min_amount" : undefined,
            minAmount: m.min_amount?.toString()
        }));
    } catch (error) {
        return [];
    }
};

export const getShippingSettings = async () => {
    return getShippingMethods();
};


export const fetchProductStock = async (sku: string) => {
    try {
        const res = await fetch(`${EMPIRE_BASE_URL}/api/products/${encodeURIComponent(sku)}/stock`, {
            cache: 'no-store' // We want real-time stock
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        return null;
    }
};

export const getCouponByCode = async (code: string) => {
    try {
        const response = await fetch(`${EMPIRE_BASE_URL}/api/coupons/code/${code}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            next: { revalidate: 60 } // Cache for 60 seconds
        });
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        return data || null;
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



export const fetchAllWoo = async (endpoint: string, extraParams: any = {}) => {
    try {
        const firstPageRes = await api.get(endpoint, {
            params: {
                per_page: 100,
                page: 1,
                ...extraParams,
            }
        });

        const data = Array.isArray(firstPageRes?.data) ? firstPageRes.data : [];
        if (!data.length) return [];

        const allItems = [...data];
        const totalPages = parseInt(firstPageRes.totalPages || '1');
        const maxPages = Math.min(totalPages, 50); // Safety limit

        if (maxPages > 1) {
            const promises = [];
            for (let p = 2; p <= maxPages; p++) {
                promises.push(
                    api.get(endpoint, {
                        params: {
                            per_page: 100,
                            page: p,
                            ...extraParams,
                        }
                    })
                );
            }
            const results = await Promise.all(promises);
            results.forEach(res => {
                if (Array.isArray(res?.data)) {
                    allItems.push(...res.data);
                }
            });
        }

        return allItems;
    } catch (e) {
        return [];
    }
};

export default api;
