
export function extractRelatedIdentifiers(product: any) {
    if (!product || !Array.isArray(product.meta_data)) return [];

    const prefixes = [
        'related_other_color_',
        'other_color_',
        'related_other_model_',
        'other_model_',
        'related_matching_product_',
        'matching_product_',
        'related_matching_knobrose_',
        'matching_knobrose_',
        'related_matching_keyrose_',
        'matching_keyrose_',
        'related_matching_pcrose_',
        'matching_pcrose_',
        'related_matching_toiletrose_',
        'matching_toiletrose_',
        'related_matching_blindrose_',
        'matching_blindrose_',
        'related_must_need_product_',
        'must_need_product_',
    ];

    const identifiers = new Set<string>();
    product.meta_data.forEach((m: any) => {
        if (prefixes.some(p => m.key.startsWith(p)) && m.value && String(m.value).trim() !== "") {
            identifiers.add(String(m.value).trim());
        }
    });

    return Array.from(identifiers);
}

/**
 * Validate whether a text field (description or USP) contains actual readable text
 * and is not an image path, file URL, or corrupted JSON upload string.
 */
export function isValidProductText(text: any): boolean {
    if (text === null || text === undefined) return false;
    const str = typeof text === "string" ? text : String(text);
    const trimmed = str.trim();
    if (trimmed === "" || trimmed === "null" || trimmed === "undefined" || trimmed === "false") return false;

    // Check for raw/corrupted image or file paths
    if (
        trimmed.startsWith("empireFiles/") ||
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("/storage/") ||
        trimmed.includes("dayzsolutions.nl/storage/") ||
        trimmed.includes("set-products/")
    ) {
        return false;
    }

    // Check for JSON artifacts or file extensions in file/URL-like strings
    if (
        /(\.webp|\.jpg|\.jpeg|\.png|\.gif|\.svg|\.pdf)($|["'\\\]\s])/i.test(trimmed) &&
        (trimmed.includes("empireFiles") || trimmed.includes("http") || trimmed.includes("storage") || trimmed.includes("/") || trimmed.includes("\\"))
    ) {
        return false;
    }

    return true;
}
