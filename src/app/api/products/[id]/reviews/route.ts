import { NextResponse } from "next/server";
import api from "@/lib/woocommerce";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: productId } = await params;

        if (!productId) {
            return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
        }

        // Fetch reviews for this product
        const response = await api.get("products/reviews", {
            params: {
                product: productId,
                status: "approved",
                per_page: 50 // reasonable limit
            }
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        // console.error("Error fetching reviews:", error);
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
        const { review, reviewer, reviewer_email, rating } = body;

        if (!review || !reviewer || !reviewer_email || !rating) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const data = {
            product_id: parseInt(productId),
            review,
            reviewer,
            reviewer_email,
            rating: parseInt(rating),
            verified: true
        };

        const response = await api.post("products/reviews", data);

        return NextResponse.json(response.data, { status: 201 });
    } catch (error: any) {
        // console.error("Error submitting review:", error);
        return NextResponse.json(
            { message: error.message || "Failed to submit review" },
            { status: 500 }
        );
    }
}
