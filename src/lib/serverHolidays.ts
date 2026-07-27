import fs from 'fs';
import path from 'path';

/**
 * Reads holidays directly from the filesystem.
 * This should ONLY be used in Server Components or Server Actions
 * to avoid Webpack bundling issues with 'fs' in client bundles.
 */
export const getServerHolidays = (): { shipping: string[], delivery: string[] } => {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'holidays.json');
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            return {
                shipping: data.shipping || data.dates || [],
                delivery: data.delivery || data.dates || []
            };
        }
    } catch (e) {
        console.error("Failed to read server holidays:", e);
    }
    
    return { shipping: [], delivery: [] };
};
