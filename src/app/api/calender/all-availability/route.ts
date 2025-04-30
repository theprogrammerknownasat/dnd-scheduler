// src/app/api/calendar/all-availability/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

const getAvailabilityPath = () => path.join(process.cwd(), 'data', 'availability.json');

const getAvailability = () => {
    try {
        // Check if the availability file exists
        if (!fs.existsSync(getAvailabilityPath())) {
            return {};
        }

        return JSON.parse(fs.readFileSync(getAvailabilityPath(), 'utf-8'));
    } catch (error) {
        console.error('Error reading availability:', error);
        return {};
    }
};

// Get all users' availability
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

        return NextResponse.json({
            success: true,
            availability: allAvailability
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}