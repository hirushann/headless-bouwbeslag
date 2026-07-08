import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, first_name, last_name, company_name } = body;

        if (!email || !password || !first_name || !last_name || !company_name) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const empireUrl = (process.env.EMPIRE_BACKEND_API_URL || process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test").replace(/\/$/, "");

        const res = await fetch(`${empireUrl}/api/register-b2b`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return NextResponse.json(
                { message: errorData.message || "Registration failed" },
                { status: res.status }
            );
        }

        const data = await res.json();
        return NextResponse.json({ success: true, data: data });
    } catch (error: any) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
