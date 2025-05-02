// src/app/api/scheduled-sessions/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import ScheduledSession from '@/models/ScheduledSession';
import Campaign from '@/models/Campaign';

// Delete a scheduled session (admin only)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
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

        const sessionId = params.id;
        if (!sessionId) {
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

        // Verify admin has access to this campaign
        if (!campaign.users.includes(username) && !isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Verify session belongs to this campaign
        const session = await ScheduledSession.findById(sessionId);
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

        // Delete session
        await ScheduledSession.findByIdAndDelete(sessionId);

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