import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const smtpHost = (process.env.SMTP_HOST || process.env.MAIL_HOST || "smtp.gmail.com").trim();
        const smtpPort = (process.env.SMTP_PORT || process.env.MAIL_PORT || "587").trim();
        const smtpUser = (process.env.SMTP_USER || process.env.MAIL_USERNAME || "").trim();
        const smtpPass = (process.env.SMTP_PASS || process.env.MAIL_PASSWORD || "").trim();

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: Number(smtpPort),
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtpUser, 
                pass: smtpPass,
            },
        });
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
        if (!smtpUser || !smtpPass) {
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

        const EMPIRE_API_URL = process.env.EMPIRE_BACKEND_API_URL || process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test";
        const BASE_URL = EMPIRE_API_URL.replace(/\/$/, "");

        const data = {
            email,
            password,
            first_name,
            last_name,
            company_name,
            coc_number,
            vat_number
        };

        // Create Customer in Empire
        const response = await fetch(`${BASE_URL}/api/register-b2b`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const responseData = await response.json();
            const customerId = responseData.user?.id;
            const adminEmail = process.env.ADMIN_EMAIL || "contact@bouwbeslag.nl"; // Configure this in .env!

            // Generate Approval/Reject Links
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; // Ensure this is set
            const approveLink = `${baseUrl}/api/admin/approve-b2b?id=${customerId}&action=approve&secret=${process.env.ADMIN_SECRET || 'secret'}`;
            const rejectLink = `${baseUrl}/api/admin/approve-b2b?id=${customerId}&action=reject&secret=${process.env.ADMIN_SECRET || 'secret'}`;

            try {
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

                // Add delay for Mailtrap free tier limit (too many emails per second)
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 2. Send Email to CUSTOMER
                await transporter.sendMail({
                    from: '"Bouwbeslag.nl" <contact@bouwbeslag.nl>',
                    to: email,
                    subject: "De aanvraag voor een bouwbeslag.nl B2B account is ontvangen!",
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <img src="${baseUrl}/logo.webp" alt="Bouwbeslag.nl Logo" style="width: 200px; margin-bottom: 20px;" />
                            <h2>Bedankt voor je aanvraag, ${first_name}!</h2>
                            <p>We hebben de registratie voor een zakelijk account ontvangen.</p>
                            <p>De aanvraag wordt momenteel beoordeeld. Je ontvangt een e-mail zodra het account is goedgekeurd of geweigerd. Tot die tijd kan je nog niet inloggen.</p>
                            <br>
                            <p>Met vriendelijke groet,</p>
                            <p><strong>Team Bouwbeslag.nl</strong></p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error("Failed to send notification emails:", emailError);
                // Do NOT return 500 here! The user was successfully created.
            }

            return NextResponse.json(
                { message: "Account created successfully. Pending approval.", customer: responseData.user },
                { status: 201 }
            );
        } else {
            const errBody = await response.json();
            return NextResponse.json(
                { message: errBody.message || "Failed to create account" },
                { status: response.status }
            );
        }

    } catch (error: any) {
        console.error("B2B Registration Error:", error);
        const msg = error.message || "Er is iets misgegaan.";
        return NextResponse.json(
            { message: msg },
            { status: 500 }
        );
    }
}
