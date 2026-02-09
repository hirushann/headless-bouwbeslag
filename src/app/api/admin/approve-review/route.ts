import { NextResponse } from "next/server";
import api from "@/lib/woocommerce";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action"); // 'approve' | 'reject' | 'delete'
    const secret = searchParams.get("secret");

    // 1. Security Check
    const envSecret = process.env.ADMIN_SECRET || "secret";
    if (secret !== envSecret) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!id || !action) {
        return NextResponse.json({ message: "Missing params" }, { status: 400 });
    }

    try {
        let status = "";
        let actionLabel = "";
        let color = "";

        if (action === "approve") {
            status = "approved";
            actionLabel = "Goedgekeurd";
            color = "green";
        } else if (action === "reject") {
            status = "hold"; // Or "unapproved"
            actionLabel = "In de wacht gezet";
            color = "orange";
        } else if (action === "delete") {
            // Delete review
            await api.put(`products/reviews/${id}`, { status: "trash" });
            actionLabel = "Verwijderd (naar prullenbak)";
            color = "red";

            return new NextResponse(`
                <html>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <h1 style="color: ${color};">${actionLabel}</h1>
                        <p>De review (ID: ${id}) is verplaatst naar de prullenbak.</p>
                        <script>setTimeout(() => window.close(), 3000);</script>
                    </body>
                </html>
            `, { headers: { "Content-Type": "text/html" } });
        }

        // Update Review Status in WooCommerce
        await api.put(`products/reviews/${id}`, {
            status: status
        });

        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: ${color};">Review ${actionLabel}</h1>
                    <p>De review (ID: ${id}) is nu gemarkeerd als: <strong>${status}</strong>.</p>
                    <script>setTimeout(() => window.close(), 3000);</script>
                </body>
            </html>
        `, {
            headers: { "Content-Type": "text/html" }
        });

    } catch (error: any) {
        return NextResponse.json({ message: "Error processing request", details: error.message }, { status: 500 });
    }
}
