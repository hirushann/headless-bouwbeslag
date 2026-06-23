import { NextResponse } from 'next/server';
import fs from 'fs';

export async function POST(req: Request) {
  const data = await req.json();
  fs.writeFileSync('debug-log.json', JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true });
}
