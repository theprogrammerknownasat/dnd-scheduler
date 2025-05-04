// src/app/api/calendar/availability/route.ts
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

        // Query availability for the date range and campaign
        const startDateObj = parseISO(startDate);
        const endDateObj = parseISO(endDate);

        const availabilityRecords = await Availability.find({
            username,
            campaignId,
            date: {
                $gte: startDateObj,
                $lte: endDateObj
            }
        });

        // Convert to the expected format
        const availability: Record<string, boolean> = {};

        availabilityRecords.forEach(record => {
            const dateStr = format(record.date, 'yyyy-MM-dd');
            Object.entries(record.timeSlots.toJSON()).forEach(([hour, isAvailable]) => {
                availability[`${dateStr}-${hour}`] = <boolean>isAvailable;
            });
        });

        return NextResponse.json({
            success: true,
            availability
        });
    } catch (error) {
        console.error('Error in /api/calendar/availability (GET):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

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

        const { date, hour, isAvailable, campaignId } = await request.json();

        if (!date || hour === undefined || !campaignId) {
            return NextResponse.json(
                { success: false, error: 'Date, hour, and campaignId are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find or create availability record for this date and campaign
        const dateObj = parseISO(date);
        let availabilityRecord = await Availability.findOne({
            username,
            campaignId,
            date: dateObj
        });

        if (!availabilityRecord) {
            availabilityRecord = new Availability({
                username,
                campaignId,
                date: dateObj,
                timeSlots: {}
            });
        }

        // Update the time slot
        availabilityRecord.timeSlots.set(hour.toString(), isAvailable);
        await availabilityRecord.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/calendar/availability (POST):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}