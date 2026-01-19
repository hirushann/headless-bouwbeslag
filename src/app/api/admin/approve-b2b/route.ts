import { NextResponse } from "next/server";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import nodemailer from "nodemailer";

// Initialize WooCommerce API
const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string,
    consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY as string,
    consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET as string,
    version: "wc/v3",
});

// Email Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action"); // 'approve' | 'reject'
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
        // Fetch current customer data to get email/name
        const customerRes = await api.get(`customers/${id}`);
        const customer = customerRes.data;
        const customerEmail = customer.email;
        const customerName = customer.first_name;

        let newStatus = "";
        let subject = "";
        let message = "";

        if (action === "approve") {
            newStatus = "approved";
            subject = "Uw zakelijke account is goedgekeurd!";
            message = `
                <h2>Gefeliciteerd, ${customerName}!</h2>
                <p>Uw zakelijke account bij Bouwbeslag.nl is goedgekeurd.</p>
                <p>U kunt nu inloggen en profiteren van uw zakelijke voordelen.</p>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/account/login" style="background: #0066FF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Direct Inloggen</a>
            `;
        } else if (action === "reject") {
            newStatus = "rejected";
            subject = "Status van uw zakelijke aanvraag";
            message = `
                <h2>Beste ${customerName},</h2>
                <p>Helaas kunnen wij uw aanvraag voor een zakelijk account momenteel niet goedkeuren.</p>
                <p>Neem contact met ons op als u hierover vragen heeft.</p>
            `;
        } else {
            return NextResponse.json({ message: "Invalid action" }, { status: 400 });
        }

        // 2. Update Customer Meta in WooCommerce
        await api.put(`customers/${id}`, {
            meta_data: [
                {
                    key: "b2b_status",
                    value: newStatus
                }
            ]
        });

        // 3. Send Notification Email to User
        await transporter.sendMail({
            from: '"Bouwbeslag.nl" <contact@bouwbeslag.nl>',
            to: customerEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                     <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo.png" alt="Bouwbeslag.nl Logo" style="width: 200px; margin-bottom: 20px;" />
                    ${message}
                    <br><br>
                    <p>Met vriendelijke groet,</p>
                    <p><strong>Team Bouwbeslag.nl</strong></p>
                </div>
            `
        });

        // 4. Return HTML success page
        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: ${action === 'approve' ? 'green' : 'red'};">
                        Actie Geslaagd: ${action === 'approve' ? 'Goedgekeurd' : 'Afgewezen'}
                    </h1>
                    <p>De klant (${customerEmail}) is op de hoogte gesteld.</p>
                </body>
            </html>
        `, {
            headers: { "Content-Type": "text/html" }
        });

    } catch (error: any) {
        console.error("Approval Error:", error.response?.data || error);
        return NextResponse.json({ message: "Error processing request", details: error.message }, { status: 500 });
    }
}
