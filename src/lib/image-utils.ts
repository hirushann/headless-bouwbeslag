export function fixImageSrc(src: string | undefined | null): string {
    if (!src || typeof src !== "string" || src.trim() === "") return "/default-fallback-image.webp";

    let finalSrc = src.trim();

    // Fix protocol-relative URLs
    if (finalSrc.startsWith("//")) {
        finalSrc = `https:${finalSrc}`;
    }

    // Replace staging domains or specific backend domains to use local proxy
    const WP_URL = "https://app.bouwbeslag.nl";
    if (finalSrc.startsWith(WP_URL)) {
        finalSrc = finalSrc.replace(WP_URL, "");
    }

    if (!finalSrc.includes("staging-plugin-test.test")) {
        finalSrc = finalSrc.replace("http://bouwbeslag.nl", "https://bouwbeslag.nl");
    }

    if (!finalSrc.startsWith("/") && !finalSrc.startsWith("http")) {
        return "/default-fallback-image.webp";
    }

    return finalSrc;
}
