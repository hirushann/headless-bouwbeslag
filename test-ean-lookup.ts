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
        const namespace = endpoint.startsWith("wp/") || endpoint.startsWith("wc/") ? "" : `${this.version}/`;
        const requestUrl = new URL(`${this.url}/wp-json/${namespace}${endpoint}`);

        // Add Basic Auth
        const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);
        const headers: HeadersInit = {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
        };

        const params = isGet ? (data.params || data) : data;

        const config: any = {
            method,
            headers,
        };

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

        // console.log(`Requesting: ${requestUrl.toString()}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const response = await fetch(requestUrl.toString(), { ...config, signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("API Error Response:", errorData);
                throw new Error(errorData.message || response.statusText);
            }
            const responseData = await response.json();
            return {
                data: responseData,
                total: response.headers.get('x-wp-total'),
                totalPages: response.headers.get('x-wp-totalpages')
            };
        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error(`Request failed (${requestUrl.toString()}):`, error.message);
            throw error;
        }
    }

    get(endpoint: string, params: any = {}) {
        return this.request("GET", endpoint, params);
    }
}

const api = new WooCommerceClient({
    url: WP_API_URL,
    consumerKey: CK,
    consumerSecret: CS,
    version: "wc/v3",
});

async function findProductWithEan() {
    if (!WP_API_URL || !CK || !CS) {
        console.error("Missing environment variables");
        return null;
    }

    try {
        // console.log("Fetching products to find an EAN...");
        // Fetch 20 products and look for one with meta_data containing 'ean' or similar keys
        const res = await api.get("products", { per_page: 20 });

        if (!res.data || res.data.length === 0) {
            // console.log("No products found.");
            return;
        }

        const eanKeys = [
            "crucial_data_product_ean_code",
            "_sku",
            "crucial_data_product_factory_sku",
            "ean_code",
            "ean",
            "_global_unique_id",
            "gtin",
            "upc",
            "isbn",
            "_wpm_gtin_code",
            "global_unique_id",
            "_wpm_gtin",
            "_gtin",
            "_ean"
        ];

        let foundProduct = null;
        let foundEan = null;
        let foundKey = null;

        for (const p of res.data) {
            for (const key of eanKeys) {
                const meta = p.meta_data.find((m: any) => m.key === key);
                if (meta && meta.value) {
                    foundProduct = p;
                    foundEan = meta.value;
                    foundKey = key;
                    break;
                }
            }
            if (foundProduct) break;
        }

        if (foundProduct) {
            // console.log(`Found Product: ${foundProduct.name} (ID: ${foundProduct.id})`);
            // console.log(`EAN Key: ${foundKey}`);
            // console.log(`EAN Value: ${foundEan}`);
            // console.log("---------------------------------------------------");
            return { ean: foundEan, id: foundProduct.id };
        } else {
            // console.log("Could not find a product with a visible EAN in the first 20 items.");
            return null;
        }
    } catch (error: any) {
        console.error("Error finding product:", error.message);
        return null;
    }
}

async function testLookup(ean: string, expectedId: number) {
    // console.log(`Testing lookup for EAN: "${ean}"...`);

    // Simulating the logic from actions.ts locally since we can't import server actions easily in this raw script
    // We will copy the core logic of fetchProductBySkuOrIdAction here for the test

    const targetMetaKeys = [
        "crucial_data_product_ean_code",
        "_sku",
        "crucial_data_product_factory_sku",
        "ean_code",
        "ean",
        "_global_unique_id",
        "gtin",
        "upc",
        "isbn",
        "_wpm_gtin_code",
        "global_unique_id",
        "_wpm_gtin",
        "_gtin",
        "_ean"
    ];

    try {
        // 1. Precise SKU Lookup (skip for EAN test unless EAN==SKU)

        // 2. Parallel WP Meta Query
        // console.log("Starting parallel meta query...");
        const metaResults = await Promise.all(targetMetaKeys.map(async (key) => {
            try {
                // console.log(`Checking key: ${key}`);
                const wpRes = await api.get("wp/v2/product", {
                    meta_key: key,
                    meta_value: ean,
                    _fields: "id",
                    per_page: 1,
                    cache: "no-store"
                });
                if (Array.isArray(wpRes.data) && wpRes.data.length > 0) {
                    const hit = wpRes.data[0];
                    // console.log(`[MATCH] Found match on key '${key}' -> ID: ${hit.id}`);
                    return { id: Number(hit.id), key: key };
                }
            } catch (e: any) {
                // console.log(`Error on key ${key}: ${e.message}`);
            }
            return null;
        }));

        const foundMatch = metaResults.find(m => m !== null);

        if (foundMatch) {
            // console.log(`✅ SUCCESS: Found product ID ${foundMatch.id} using EAN "${ean}" via key "${foundMatch.key}"`);
            if (foundMatch.id === expectedId) {
                // console.log("✅ ID matches expected ID.");
            } else {
                // console.log(`⚠️ ID mismatch! Expected ${expectedId}, got ${foundMatch.id}`);
            }
        } else {
            // console.log(`❌ FAILED: Could not find product using EAN "${ean}" via any meta key.`);
        }

    } catch (error: any) {
        // console.error("Test failed with error:", error.message);
    }
}

async function run() {
    const data = await findProductWithEan();
    if (data) {
        await testLookup(data.ean, data.id);
    }
}

run();
