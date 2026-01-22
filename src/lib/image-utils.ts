export function fixImageSrc(src: string | undefined | null): string {
    if (!src) return "/default-fallback-image.webp";

    // If it's the staging domain, leave it as is (user says it works on /categories)
    if (src.includes("staging-plugin-test.test")) {
        return src;
    }

    // Replace the incorrect staging domain with the production domain if it was missed
    // and ensure HTTPS for production
    return src.replace("staging-plugin-test.test", "bouwbeslag.nl")
        .replace("http://bouwbeslag.nl", "https://bouwbeslag.nl");
}
