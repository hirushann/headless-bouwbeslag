import { NextResponse } from "next/server";

export async function GET() {
    const id = "11199";
    const code = "57112442ebe476.33241772";
    const url = `https://dashboard.webwinkelkeur.nl/api/1.0/ratings_summary.json?id=${id}&code=${code}`;

    try {
        const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

        if (!res.ok) {
            throw new Error(`WebwinkelKeur API error: ${res.statusText}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        // console.error("Error fetching WebwinkelKeur data:", error);
        return NextResponse.json({ status: "error", message: "Failed to fetch data" }, { status: 500 });
    }
}
