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
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Laagste Prijs Garantie Aanvraag</title>
              <style>
                body { margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                .header { background-color: #0d0038; padding: 20px; text-align: center; }
                .logo { height: 30px; }
                .content { padding: 40px 20px; text-align: center; }
                .title { font-size: 24px; font-weight: bold; color: #0d0038; margin-bottom: 20px; }
                .intro { color: #555555; font-size: 16px; line-height: 1.5; margin-bottom: 30px; }
                .box-header { background-color: #e6e6fa; color: #0d0038; padding: 15px; font-weight: bold; font-size: 18px; text-align: center; border-radius: 4px; margin-bottom: 20px; }
                .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .details-table th { background-color: #0d0038; color: #ffffff; padding: 12px; text-align: left; font-size: 14px; }
                .details-table td { padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 14px; color: #333; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #888; background-color: #f4f4f4; }
              </style>
            </head>
            <body>
              <div class="container">
                <!-- Header -->
                <div class="header">
                  <a href="https://bouwbeslag.nl">
                    <img src="https://bouwbeslag.nl/logo.webp" alt="Bouwbeslag.nl" class="logo" style="max-height: 35px; width: auto;">
                  </a>
                </div>

                <!-- Content -->
                <div class="content">
                  <h1 class="title">Nieuwe Aanvraag ontvangen!</h1>
                  <p class="intro">
                    Hi Admin,<br>
                    Er is een nieuwe aanvraag binnengekomen voor de <strong>Laagste Prijs Garantie</strong>. Hieronder vind je de details van de aanvraag.
                  </p>

                  <!-- Details Box Header -->
                  <div class="box-header">
                    Aanvraag details
                  </div>
                  
                  <!-- Details Table -->
                  <table class="details-table">
                    <thead>
                      <tr>
                        <th colspan="2">Informatie</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td width="40%"><strong>Naam klant</strong></td>
                        <td>${name}</td>
                      </tr>
                      <tr>
                        <td><strong>Email</strong></td>
                        <td><a href="mailto:${email}" style="color: #0066FF; text-decoration: none;">${email}</a></td>
                      </tr>
                      <tr>
                        <td><strong>Eigen Product</strong></td>
                        <td><a href="${productLink}" style="color: #0066FF; text-decoration: underline;">Bekijk product</a></td>
                      </tr>
                      <tr>
                        <td><strong>Concurrent Link</strong></td>
                        <td><a href="${competitorLink}" style="color: #0066FF; text-decoration: underline;">Bekijk concurrent</a></td>
                      </tr>
                      <tr>
                        <td><strong>Opmerking</strong></td>
                        <td>${comments || 'Geen opmerking'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p class="intro" style="font-size: 14px; margin-top: 30px;">
                    Controleer de aanvraag en neem contact op met de klant indien de claim terecht is.
                  </p>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                  © ${new Date().getFullYear()} Bouwbeslag.nl. Alle rechten voorbehouden.
                </div>
              </div>
            </body>
            </html>
            `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    // console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het versturen van de email.' },
      { status: 500 }
    );
  }
}
