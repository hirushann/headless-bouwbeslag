export function fixImageSrc(src: string | undefined | null): string {
    if (!src || typeof src !== "string" || src.trim() === "") return "/default-fallback-image.webp";

    let finalSrc = src.trim();

    // Fix protocol-relative URLs
    if (finalSrc.startsWith("//")) {
        finalSrc = `https:${finalSrc}`;
    }

    // Rewrite Meilisearch local domains to actual staging server because local environments usually lack the FTP files
    if (finalSrc.includes("http://empire.test")) {
        finalSrc = finalSrc.replace("http://empire.test", "https://empire.dayzsolutions.nl");
    }

    // Replace staging domains or specific backend domains to use local proxy
    const WP_URL = "https://app.bouwbeslag.nl";
    if (finalSrc.startsWith(WP_URL)) {
        finalSrc = finalSrc.replace(WP_URL, "");
    }

    if (!finalSrc.includes("staging-plugin-test.test")) {
        finalSrc = finalSrc.replace("http://bouwbeslag.nl", "https://bouwbeslag.nl");
    }

    if (finalSrc.startsWith("empireFiles/")) {
        // Always use staging server for empireFiles because local environments usually don't have the FTP files downloaded
        const backendUrl = "https://empire.dayzsolutions.nl";
        const filenameWithExt = finalSrc.replace("empireFiles/", "");
        
        // Split into name and extension
        const lastDotIndex = filenameWithExt.lastIndexOf(".");
        let name = filenameWithExt;
        let ext = "";
        
        if (lastDotIndex !== -1) {
            name = filenameWithExt.substring(0, lastDotIndex);
            ext = filenameWithExt.substring(lastDotIndex); // includes the dot
        }
        
        // Slugify the name (Laravel Str::slug equivalent)
        const slugifiedName = name
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // remove accents
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\- ]/g, '') // remove invalid chars
            .replace(/\s+/g, '-') // replace spaces with dashes
            .replace(/\-+/g, '-'); // collapse multiple dashes
            
        return `${backendUrl}/storage/products/${slugifiedName}${ext}`;
    }

    if (!finalSrc.startsWith("/") && !finalSrc.startsWith("http")) {
        return "/default-fallback-image.webp";
    }

    return finalSrc;
}
