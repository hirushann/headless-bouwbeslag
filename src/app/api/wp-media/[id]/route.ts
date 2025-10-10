import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const wpUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/wp-json/wp/v2/media/${id}`;
    const res = await fetch(wpUrl, { next: { revalidate: 3600 } });

    if (!res.ok) {
      console.error(`[WP Media API] ${res.status} for ID ${id}`);
      return NextResponse.json(
        { error: `Media ${id} not found` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[WP Media API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}