import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseISO } from 'date-fns';
import dbConnect from '@/lib/mongodb';
import ScheduledSession from '@/models/ScheduledSession';
import Campaign from '@/models/Campaign';

// Get scheduled sessions
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

        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaignId');
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!campaignId) {
            return NextResponse.json(
                { success: false, error: 'Campaign ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user has access to this campaign
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        if (!campaign.users.includes(username)) {
            const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

            if (!isAdmin) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized' },
                    { status: 403 }
                );
            }
        }

        // Build query
        const query: any = { campaignId };

        if (start && end) {
            query.date = {
                $gte: parseISO(start),
                $lte: parseISO(end)
            };
        }

        // Get sessions
        const sessions = await ScheduledSession.find(query).sort({ date: 1, startTime: 1 });

        return NextResponse.json({
            success: true,
            sessions
        });
    } catch (error) {
        console.error('Error in /api/scheduled-sessions (GET):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a scheduled session (admin only)
export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { campaignId, title, date, startTime, endTime, notes } = await request.json();

        if (!campaignId || !title || !date || startTime === undefined || endTime === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (startTime >= endTime) {
            return NextResponse.json(
                { success: false, error: 'End time must be after start time' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if campaign exists
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Create session
        const session = await ScheduledSession.create({
            campaignId,
            title,
            date: parseISO(date),
            startTime,
            endTime,
            notes: notes || ''
        });

        return NextResponse.json({
            success: true,
            session
        });
    } catch (error) {
        console.error('Error in /api/scheduled-sessions (POST):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}