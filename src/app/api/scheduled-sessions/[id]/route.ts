// src/app/api/scheduled-sessions/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import ScheduledSession from '@/models/ScheduledSession';
import Campaign from '@/models/Campaign';

// Delete a scheduled session (admin only)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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
                { success: false, error: 'Only admins can delete sessions' },
                { status: 403 }
            );
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Get the campaignId from the request body
        const { campaignId } = await request.json();
        if (!campaignId) {
            return NextResponse.json(
                { success: false, error: 'Campaign ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if campaign exists and user has access
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Verify session belongs to this campaign
        const session = await ScheduledSession.findById(id);
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Session not found' },
                { status: 404 }
            );
        }

        if (session.campaignId !== campaignId) {
            return NextResponse.json(
                { success: false, error: 'Session does not belong to this campaign' },
                { status: 403 }
            );
        }

        // Check if this is part of a recurring session group
        if (session.isRecurring && session.recurringGroupId) {
            // Get all sessions in this recurring group
            const allSessions = await ScheduledSession.find({
                campaignId,
                recurringGroupId: session.recurringGroupId
            }).sort({ recurringIndex: 1 });

            // Check if this is the first session in the group
            if (allSessions[0]._id.toString() === id) {
                // If it's the first session and we have at least one more in the group,
                // create the next one in the sequence
                if (allSessions.length < session.maxRecurrences) {
                    const lastSession = allSessions[allSessions.length - 1];

                    // Calculate the next date
                    const nextDate = new Date(lastSession.date);
                    nextDate.setDate(nextDate.getDate() + session.recurringDays);

                    // Create the next session
                    await ScheduledSession.create({
                        title: session.title,
                        date: nextDate,
                        startTime: session.startTime,
                        endTime: session.endTime,
                        notes: session.notes,
                        campaignId,
                        createdBy: session.createdBy,
                        isRecurring: true,
                        recurringDays: session.recurringDays,
                        recurringGroupId: session.recurringGroupId,
                        recurringIndex: allSessions.length,
                        maxRecurrences: session.maxRecurrences
                    });
                }
            }
        }

        // Delete session
        await ScheduledSession.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Session deleted successfully'
        });
    } catch (error) {
        console.error('Error in /api/scheduled-sessions/[id] (DELETE):', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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
                { success: false, error: 'Only admins can update sessions' },
                { status: 403 }
            );
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Session ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { campaignId, title, date, startTime, endTime, notes } = body;

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

        // Find and update session
        const session = await ScheduledSession.findById(id);
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Session not found' },
                { status: 404 }
            );
        }

        if (session.campaignId !== campaignId) {
            return NextResponse.json(
                { success: false, error: 'Session does not belong to this campaign' },
                { status: 403 }
            );
        }

        let dateString: string;
        if (date instanceof Date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateString = `${year}-${month}-${day}`;
        } else {
            dateString = date;
        }


        // Update session with string date
        session.title = title;
        session.date = dateString; // Store as string, not Date object
        session.startTime = startTime;
        session.endTime = endTime;
        session.notes = notes || '';

        await session.save();

        return NextResponse.json({
            success: true,
            session
        });
    } catch (error) {
        console.error('Error in /api/scheduled-sessions/[id] (PUT):', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}