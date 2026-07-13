import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  const data = await req.json();
  const debugDir = path.join(process.cwd(), 'artifacts/debug');
  fs.mkdirSync(debugDir, { recursive: true });
  fs.writeFileSync(path.join(debugDir, 'debug-log.json'), JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true });
}
