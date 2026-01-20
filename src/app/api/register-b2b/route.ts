import { NextResponse } from "next/server";
import axios from "axios";
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import nodemailer from "nodemailer";

// Initialize WooCommerce API
const api = new WooCommerceRestApi({
    url: process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string,
    consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY as string,
    consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET as string,
    version: "wc/v3",
});

// Email Transporter (using environment variables)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, // e.g. ""
        pass: process.env.SMTP_PASS,
    },
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            email,
            password,
            first_name,
            last_name,
            company_name,
            coc_number,
            vat_number
        } = body;

        // Check for SMTP credentials first to verify we can send emails
        // This prevents creating "zombie" users if email config is missing
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.error("Registration blocked: Missing SMTP_USER or SMTP_PASS");
            return NextResponse.json(
                { message: "Server configuration error: Email service not configured." },
                { status: 500 }
            );
        }

        // Validation
        if (!email || !password || !first_name || !last_name || !company_name) {
            return NextResponse.json(
                { message: "Vul alle verplichte velden in." },
                { status: 400 }
            );
        }

        const role = "b2b_customer";

        const data = {
            email,
            password,
            first_name,
            last_name,
            username: email,
            role: role,
            billing: {
                first_name,
                last_name,
                company: company_name,
                email,
            },
            shipping: {
                first_name,
                last_name,
                company: company_name,
            },
            meta_data: [
                { key: "kvk_nummer", value: coc_number },
                { key: "btw_nummer", value: vat_number },
                { key: "billing_company", value: company_name },
                { key: "is_b2b_registration", value: "yes" },
                { key: "b2b_status", value: "pending" } // pending | approved | rejected
            ],
        };

        // Create Customer in WooCommerce
        const response = await api.post("customers", data);

        if (response.status === 201) {
            const customerId = response.data.id;
            const adminEmail = process.env.ADMIN_EMAIL || "contact@bouwbeslag.nl"; // Configure this in .env!

            // Generate Approval/Reject Links (using API routes we will create)
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; // Ensure this is set
            const approveLink = `${baseUrl}/api/admin/approve-b2b?id=${customerId}&action=approve&secret=${process.env.ADMIN_SECRET || 'secret'}`;
            const rejectLink = `${baseUrl}/api/admin/approve-b2b?id=${customerId}&action=reject&secret=${process.env.ADMIN_SECRET || 'secret'}`;

            // 1. Send Email to ADMIN
            await transporter.sendMail({
                from: '"Bouwbeslag.nl Website" <contact@bouwbeslag.nl>',
                to: adminEmail,
                subject: `Nieuwe zakelijke aanmelding: ${company_name}`,
                html: `
                    <h2>Nieuwe B2B Aanvraag</h2>
                    <p>Er is een nieuwe zakelijke registratie ontvangen:</p>
                    <ul>
                        <li><strong>Bedrijf:</strong> ${company_name}</li>
                        <li><strong>Contactpersoon:</strong> ${first_name} ${last_name}</li>
                        <li><strong>Email:</strong> ${email}</li>
                        <li><strong>KVK:</strong> ${coc_number}</li>
                        <li><strong>BTW:</strong> ${vat_number}</li>
                    </ul>
                    <p>Klik hieronder om de aanvraag te beoordelen:</p>
                    <div style="margin: 20px 0;">
                        <a href="${approveLink}" style="background: green; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Goedkeuren</a>
                        <a href="${rejectLink}" style="background: red; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Afwijzen</a>
                    </div>
                `
            });

            // 2. Send Email to CUSTOMER
            await transporter.sendMail({
                from: '"Bouwbeslag.nl" <contact@bouwbeslag.nl>',
                to: email,
                subject: "De aanvraag voor een bouwbeslag.nl B2B account is ontvangen!",
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <img src="${baseUrl}/logo.png" alt="Bouwbeslag.nl Logo" style="width: 200px; margin-bottom: 20px;" />
                        <h2>Bedankt voor je aanvraag, ${first_name}!</h2>
                        <p>We hebben de registratie voor een zakelijk account ontvangen.</p>
                        <p>De aanvraag wordt momenteel beoordeeld. Jeontvangt een e-mail zodra het account is goedgekeurd. of geweigerd. Tot die tijd kan je nog niet inloggen.</p>
                        <br>
                        <p>Met vriendelijke groet,</p>
                        <p><strong>Team Bouwbeslag.nl</strong></p>
                    </div>
                `
            });

            return NextResponse.json(
                { message: "Account created successfully. Pending approval.", customer: response.data },
                { status: 201 }
            );
        } else {
            return NextResponse.json(
                { message: "Failed to create account" },
                { status: response.status }
            );
        }

    } catch (error: any) {
        console.error("Registration error:", error.response?.data || error.message);

        // Handle "username already exists" etc.
        const msg = error.response?.data?.message || error.message || "Er is iets misgegaan.";

        return NextResponse.json(
            { message: msg },
            { status: 500 }
        );
    }
}
