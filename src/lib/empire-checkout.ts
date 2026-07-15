const EMPIRE_BASE_URL = (
    process.env.NEXT_PUBLIC_EMPIRE_API_URL
    || process.env.EMPIRE_BACKEND_API_URL
    || "http://empire.test"
).replace(/\/$/, "");

export interface ShippingMethod {
    id: string;
    methodId: string;
    title: string;
    cost: number;
    enabled: boolean;
    requires?: "min_amount";
    minAmount?: string;
}

export interface ShippingRule {
    id: number;
    country_code: string;
    country_name: string;
    shipping_cost: number;
    free_shipping_threshold: number;
    is_active: boolean;
}

export async function getShippingSettings(): Promise<ShippingMethod[]> {
    const response = await fetch(`${EMPIRE_BASE_URL}/api/shipping/settings`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Unable to load shipping methods from Laravel");
    }

    const methods = await response.json();

    return methods.map((method: any) => ({
        id: method.method_id,
        methodId: method.method_id,
        title: method.title,
        cost: Number(method.cost || 0),
        enabled: Boolean(method.enabled),
        requires: method.min_amount ? "min_amount" : undefined,
        minAmount: method.min_amount?.toString(),
    }));
}

export async function getShippingRules(): Promise<ShippingRule[]> {
    const response = await fetch(`${EMPIRE_BASE_URL}/api/shipping-rules/active`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Unable to load shipping rules from Laravel");
    }

    const result = await response.json();

    return result.data || [];
}

export async function getCouponByCode(code: string): Promise<any | null> {
    const response = await fetch(`${EMPIRE_BASE_URL}/api/coupons/code/${encodeURIComponent(code)}`, {
        headers: {
            Accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        return null;
    }

    return response.json();
}
