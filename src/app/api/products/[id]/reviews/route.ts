import { NextResponse } from "next/server";
import api from "@/lib/woocommerce";
import { sendMail } from "@/lib/mail";

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
        const { review, reviewer, reviewer_email, rating, productName } = body;

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

        // Send notification email to admin
        try {
            const adminEmail = process.env.ADMIN_EMAIL || "contact@bouwbeslag.nl";
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl";
            const secret = process.env.ADMIN_SECRET || "secret";
            const reviewId = response.data.id;

            const approveLink = `${baseUrl}/api/admin/approve-review?id=${reviewId}&action=approve&secret=${secret}`;
            const rejectLink = `${baseUrl}/api/admin/approve-review?id=${reviewId}&action=reject&secret=${secret}`;
            const deleteLink = `${baseUrl}/api/admin/approve-review?id=${reviewId}&action=delete&secret=${secret}`;

            await sendMail({
                to: adminEmail,
                subject: `Nieuwe review voor ${productName || "Product ID: " + productId}`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #0066FF;">Nieuwe Product Review Ontvangen</h2>
                        <p>Er is een nieuwe review geplaatst op de website.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; width: 150px;">Product:</td>
                                <td style="padding: 8px 0;">${productName || "Product ID: " + productId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold;">Reviewer:</td>
                                <td style="padding: 8px 0;">${reviewer} (${reviewer_email})</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold;">Rating:</td>
                                <td style="padding: 8px 0;">${rating} / 5</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Bericht:</td>
                                <td style="padding: 8px 0; background: #f9f9f9; border-radius: 5px; padding: 10px;">${review}</td>
                            </tr>
                        </table>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p><strong>Beheer deze review:</strong></p>
                        <div style="margin: 20px 0; display: flex; gap: 10px;">
                            <a href="${approveLink}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Goedkeuren</a>
                            <a href="${rejectLink}" style="background: #ffc107; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Afwijzen</a>
                            <a href="${deleteLink}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verwijderen</a>
                        </div>
                        <p style="font-size: 12px; color: #888; margin-top: 30px;">
                            Je kunt de review ook beheren in het <a href="${process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace('/wp-json', '')}/wp-admin/edit-comments.php?comment_status=moderated">WordPress Dashboard</a>.
                        </p>
                    </div>
                `
            });
        } catch (mailError) {
            // console.error("Failed to send review notification email:", mailError);
            // We don't want to fail the whole request if only the email fails
        }

        return NextResponse.json(response.data, { status: 201 });
    } catch (error: any) {
        // console.error("Error submitting review:", error);
        return NextResponse.json(
            { message: error.message || "Failed to submit review" },
            { status: 500 }
        );
    }
}

