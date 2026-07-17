
export function extractRelatedIdentifiers(product: any) {
    if (!product || !Array.isArray(product.meta_data)) return [];

    const prefixes = [
        'related_other_color_',
        'related_other_model_',
        'related_matching_product_',
        'related_matching_knobrose_',
        'related_matching_keyrose_',
        'related_matching_pcrose_',
        'related_matching_toiletrose_',
        'related_matching_blindrose_',
        'related_must_need_product_',
    ];

    const identifiers = new Set<string>();
    product.meta_data.forEach((m: any) => {
        if (prefixes.some(p => m.key.startsWith(p)) && m.value && String(m.value).trim() !== "") {
            identifiers.add(String(m.value).trim());
        }
    });

    return Array.from(identifiers);
}
