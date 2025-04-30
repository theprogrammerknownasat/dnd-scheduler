// src/app/api/calendar/availability/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

const getAvailabilityPath = () => path.join(process.cwd(), 'data', 'availability.json');

const getAvailability = () => {
    try {
        // Make sure the data directory exists
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        // Check if the availability file exists
        if (!fs.existsSync(getAvailabilityPath())) {
            // Create an empty availability file
            const emptyAvailability: Record<string, Record<string, boolean>> = {};
            fs.writeFileSync(getAvailabilityPath(), JSON.stringify(emptyAvailability));
            return emptyAvailability;
        }

        return JSON.parse(fs.readFileSync(getAvailabilityPath(), 'utf-8'));
    } catch (error) {
        console.error('Error reading availability:', error);
        return {};
    }
};

const saveAvailability = (username: string, availability: Record<string, boolean>) => {
    try {
        const allAvailability = getAvailability();
        allAvailability[username] = availability;

        fs.writeFileSync(getAvailabilityPath(), JSON.stringify(allAvailability));
        return true;
    } catch (error) {
        console.error('Error saving availability:', error);
        return false;
    }
};

// Get user's availability
export async function GET() {
    try {
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const allAvailability = getAvailability();
        const userAvailability = allAvailability[username] || {};

        return NextResponse.json({
            success: true,
            availability: userAvailability
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update user's availability
export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const { availability } = await request.json();

        if (saveAvailability(username, availability)) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'Could not save availability' },
                { status: 500 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}