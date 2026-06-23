import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function getEmpireUrl() {
    return (process.env.NEXT_PUBLIC_EMPIRE_API_URL || process.env.EMPIRE_BACKEND_API_URL || "http://localhost:8000").replace(/\/$/, "");
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: productId } = await params;

        if (!productId) {
            return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
        }

        const EMPIRE_BASE_URL = getEmpireUrl();
        const res = await fetch(`${EMPIRE_BASE_URL}/api/products/${productId}/reviews?limit=50`, {
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`Empire API responded with status ${res.status}`);
        }

        const data = await res.json();
        // Empire's paginate() returns data inside a 'data' property
        return NextResponse.json(data.data || []);
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: productId } = await params;
        const body = await req.json();

        if (!body.review || !body.reviewer || !body.reviewer_email || !body.rating) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const EMPIRE_BASE_URL = getEmpireUrl();
        const res = await fetch(`${EMPIRE_BASE_URL}/api/products/${productId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            throw new Error(`Empire API responded with status ${res.status}`);
        }

        const data = await res.json();
        
        // Empire sends the email notification asynchronously, no need to do it here
        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Failed to submit review" },
            { status: 500 }
        );
    }
}

