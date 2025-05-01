// src/app/api/calendar/all-availability/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseISO, format } from 'date-fns';
import dbConnect from '@/lib/mongodb';
import Availability from '@/models/Availability';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get date range and campaignId from query params
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start');
        const endDate = searchParams.get('end');
        const campaignId = searchParams.get('campaignId');

        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, error: 'Start and end dates are required' },
                { status: 400 }
            );
        }

        if (!campaignId) {
            return NextResponse.json(
                { success: false, error: 'Campaign ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Query all availability records for the date range and campaign
        const startDateObj = parseISO(startDate);
        const endDateObj = parseISO(endDate);

        const availabilityRecords = await Availability.find({
            campaignId, // Filter by campaignId
            date: {
                $gte: startDateObj,
                $lte: endDateObj
            }
        });

        // Convert to the expected format
        const allAvailability: Record<string, Record<string, boolean>> = {};

        availabilityRecords.forEach(record => {
            if (!allAvailability[record.username]) {
                allAvailability[record.username] = {};
            }

            const dateStr = format(record.date, 'yyyy-MM-dd');
            Object.entries(record.timeSlots.toJSON()).forEach(([hour, isAvailable]) => {
                allAvailability[record.username][`${dateStr}-${hour}`] = <boolean>isAvailable;
            });
        });

        return NextResponse.json({
            success: true,
            availability: allAvailability
        });
    } catch (error) {
        console.error('Error in /api/calendar/all-availability:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}