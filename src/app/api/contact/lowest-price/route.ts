import { NextResponse } from 'next/server';

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

    const empireUrl = (process.env.EMPIRE_BACKEND_API_URL || process.env.NEXT_PUBLIC_EMPIRE_API_URL || "http://empire.test").replace(/\/$/, "");

    const response = await fetch(`${empireUrl}/api/contact/lowest-price`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error("Failed to submit to Empire");
    }

    return NextResponse.json({ message: 'Aanvraag succesvol verzonden.' }, { status: 200 });
  } catch (error) {
    // console.error('Error forwarding lowest price form:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het versturen van de email.' },
      { status: 500 }
    );
  }
}
