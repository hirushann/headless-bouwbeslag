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
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { error: 'Invalid payload. Expected { shipping?: string[], delivery?: string[] }' },
                { status: 400 }
            );
        }

        // Helper to handle PHP arrays that might serialize into objects { "0": "...", "1": "..." }
        const getArray = (val: any) => Array.isArray(val) ? val : (val && typeof val === 'object' ? Object.values(val) : []);
        const rawShipping = getArray(body.shipping);
        const rawDelivery = getArray(body.delivery);

        // Basic date format validation (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const validShipping = rawShipping.filter((d: any) => typeof d === 'string' && dateRegex.test(d as string));
        const validDelivery = rawDelivery.filter((d: any) => typeof d === 'string' && dateRegex.test(d as string));

        if (validShipping.length !== rawShipping.length || validDelivery.length !== rawDelivery.length) {
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

        const newData = {
            shipping: validShipping,
            delivery: validDelivery
        };

        fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf-8');

        return NextResponse.json({
            success: true,
            message: 'Holidays updated successfully',
            shippingCount: validShipping.length,
            deliveryCount: validDelivery.length,
            data: newData
        });

    } catch (error) {
        // console.error('Error updating holidays:', error);
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
            return NextResponse.json({ shipping: [], delivery: [] });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read holidays' }, { status: 500 });
    }
}
