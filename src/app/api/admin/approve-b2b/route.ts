import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action"); // 'approve' | 'reject'
    const secret = searchParams.get("secret");

    const envSecret = process.env.ADMIN_SECRET || "secret";
    if (secret !== envSecret) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!id || !action) {
        return NextResponse.json({ message: "Missing params" }, { status: 400 });
    }

    try {
        const empireUrl = (process.env.EMPIRE_BACKEND_API_URL || process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test").replace(/\/$/, "");

        const res = await fetch(`${empireUrl}/api/admin/approve-b2b?id=${id}&action=${action}&secret=${secret}`, {
            method: "GET",
            headers: {
                "Accept": "text/html"
            }
        });

        if (!res.ok) {
            return NextResponse.json({ message: "Error processing request from Empire" }, { status: res.status });
        }

        const html = await res.text();

        return new NextResponse(html, {
            headers: { "Content-Type": "text/html" }
        });

    } catch (error: any) {
        return NextResponse.json({ message: "Error processing request", details: error.message }, { status: 500 });
    }
}
