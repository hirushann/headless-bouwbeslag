import { NextRequest, NextResponse } from "next/server";

const GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1";
const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,36}$/;
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{1,300}$/;

const getGooglePlacesHeaders = (fieldMask: string) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return null;

  return {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": fieldMask,
    Referer: process.env.NEXT_PUBLIC_SITE_URL || "https://bouwbeslag.nl/"
  };
};

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Ongeldige aanvraag." }, { status: 400 });
  }

  const action = body.action;
  const sessionToken = typeof body.sessionToken === "string" ? body.sessionToken : "";

  if (!SESSION_TOKEN_PATTERN.test(sessionToken)) {
    return NextResponse.json({ message: "Ongeldige zoeksessie." }, { status: 400 });
  }

  if (action === "autocomplete") {
    const input = typeof body.input === "string" ? body.input.trim() : "";
    const country = typeof body.country === "string" ? body.country.toLowerCase() : "nl";

    if (input.length < 3 || input.length > 200 || !/^[a-z]{2}$/.test(country)) {
      return NextResponse.json({ message: "Ongeldige adreszoekopdracht." }, { status: 400 });
    }

    const headers = getGooglePlacesHeaders(
      "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text"
    );

    if (!headers) {
      return NextResponse.json({ message: "Google Places is niet geconfigureerd." }, { status: 503 });
    }

    const response = await fetch(`${GOOGLE_PLACES_BASE_URL}/places:autocomplete`, {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        input,
        includedRegionCodes: [country],
        languageCode: "nl",
        sessionToken
      })
    });

    if (!response.ok) {
      return NextResponse.json({ message: "Google adres zoeken is niet beschikbaar." }, { status: 502 });
    }

    const data = await response.json();
    const suggestions = (data.suggestions || [])
      .map((suggestion: any) => suggestion.placePrediction)
      .filter((prediction: any) => prediction?.placeId && prediction?.text?.text)
      .map((prediction: any) => ({
        placeId: prediction.placeId,
        text: prediction.text.text
      }));

    return NextResponse.json({ suggestions });
  }

  if (action === "details") {
    const placeId = typeof body.placeId === "string" ? body.placeId : "";

    if (!PLACE_ID_PATTERN.test(placeId)) {
      return NextResponse.json({ message: "Ongeldige plaatsselectie." }, { status: 400 });
    }

    const headers = getGooglePlacesHeaders("addressComponents");

    if (!headers) {
      return NextResponse.json({ message: "Google Places is niet geconfigureerd." }, { status: 503 });
    }

    const url = new URL(`${GOOGLE_PLACES_BASE_URL}/places/${encodeURIComponent(placeId)}`);
    url.searchParams.set("languageCode", "nl");
    url.searchParams.set("sessionToken", sessionToken);

    const response = await fetch(url, {
      headers,
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json({ message: "Google adresdetails zijn niet beschikbaar." }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({ addressComponents: data.addressComponents || [] });
  }

  return NextResponse.json({ message: "Onbekende actie." }, { status: 400 });
}
