import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        // 1. Security Check
        const authHeader = req.headers.get('authorization');

        // Extract token from "Bearer <token>"
        const token = authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null;

        const expectedToken = "2d93eb85ca303b730d46050b33e801f1";

        if (!token || token !== expectedToken) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();

        // Validate input
        if (!body || !Array.isArray(body.dates)) {
            return NextResponse.json(
                { error: 'Invalid payload. Expected { dates: string[] }' },
                { status: 400 }
            );
        }

        // Basic date format validation (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const validDates = body.dates.filter((d: any) => typeof d === 'string' && dateRegex.test(d));

        if (validDates.length !== body.dates.length) {
            return NextResponse.json(
                { error: 'Invalid date format found. Use YYYY-MM-DD.' },
                { status: 400 }
            );
        }

        // Write to file
        const dataDir = path.join(process.cwd(), 'src', 'data');
        const filePath = path.join(dataDir, 'holidays.json');

        // Ensure directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify({ dates: validDates }, null, 2), 'utf-8');

        return NextResponse.json({
            success: true,
            message: 'Holidays updated successfully',
            count: validDates.length,
            dates: validDates
        });

    } catch (error) {
        console.error('Error updating holidays:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'holidays.json');
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            return NextResponse.json(data);
        } else {
            return NextResponse.json({ dates: [] });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read holidays' }, { status: 500 });
    }
}
