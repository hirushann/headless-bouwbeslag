import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, productLink, competitorLink, comments } = body;

        if (!name || !email || !productLink || !competitorLink) {
            return NextResponse.json(
                { error: 'Vul alle verplichte velden in.' },
                { status: 400 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const mailOptions = {
            from: `"Bouwbeslag Laagste Prijs" <${process.env.SMTP_USER}>`,
            to: process.env.PAGINA_EMAIL_TO || process.env.SMTP_USER, // Fallback to sender
            subject: `Nieuwe Laagste Prijs Garantie Aanvraag`,
            html: `
        <h1>Nieuwe Aanvraag: Laagste Prijs Garantie</h1>
        <p><strong>Naam:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Product Link (Eigen):</strong> <a href="${productLink}">${productLink}</a></p>
        <p><strong>Concurrent Link:</strong> <a href="${competitorLink}">${competitorLink}</a></p>
        <p><strong>Opmerking:</strong></p>
        <p>${comments || 'Geen opmerking'}</p>
      `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Email send error:', error);
        return NextResponse.json(
            { error: 'Er is iets misgegaan bij het versturen van de email.' },
            { status: 500 }
        );
    }
}
