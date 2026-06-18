import fs from "fs/promises";
import path from "path";

const SESSIONS_DIR = path.join(process.cwd(), ".sessions");

export async function saveCheckoutSession(orderReference: string, payload: any) {
    try {
        await fs.mkdir(SESSIONS_DIR, { recursive: true });
        const filePath = path.join(SESSIONS_DIR, `${orderReference}.json`);
        await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    } catch (error) {
        console.error("Failed to save checkout session", error);
    }
}

export async function getCheckoutSession(orderReference: string) {
    try {
        const filePath = path.join(SESSIONS_DIR, `${orderReference}.json`);
        const data = await fs.readFile(filePath, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

export async function deleteCheckoutSession(orderReference: string) {
    try {
        const filePath = path.join(SESSIONS_DIR, `${orderReference}.json`);
        await fs.unlink(filePath);
    } catch (error) {
        // Ignore if file doesn't exist
    }
}
