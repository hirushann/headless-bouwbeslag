import { NextRequest, NextResponse } from "next/server";

type ResetPasswordPayload = {
  email?: unknown;
};

type BackendResponse = {
  message?: string;
  status?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
};

function backendUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readResponseBody(response: Response): Promise<BackendResponse> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as BackendResponse;
  } catch {
    return { message: text };
  }
}

export async function POST(request: NextRequest) {
  const apiBaseUrl = process.env.EMPIRE_BACKEND_API_URL || process.env.NEXT_PUBLIC_EMPIRE_API_URL;

  if (!apiBaseUrl) {
    return NextResponse.json({ message: "De backend is niet geconfigureerd." }, { status: 500 });
  }

  try {
    const body = (await request.json()) as ResetPasswordPayload;
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          message: "Vul een geldig e-mailadres in.",
          errors: { email: ["Vul een geldig e-mailadres in."] },
        },
        { status: 422 },
      );
    }

    const response = await fetch(backendUrl(apiBaseUrl, "/api/reset/password"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    const data = await readResponseBody(response);

    return NextResponse.json(
      { ...data, message: data.message || data.status },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { message: "Het verzoek kon niet worden verstuurd. Probeer het later opnieuw." },
      { status: 500 },
    );
  }
}
