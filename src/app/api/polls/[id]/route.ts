// src/app/api/polls/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Poll from '@/models/Poll';
import Campaign from '@/models/Campaign';

// DELETE a specific poll
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        await dbConnect();

        // Find the poll
        const poll = await Poll.findById(id);

        if (!poll) {
            return NextResponse.json(
                { success: false, error: 'Poll not found' },
                { status: 404 }
            );
        }

        // Verify the admin has access to this campaign
        const campaign = await Campaign.findById(poll.campaignId);
        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Delete the poll
        await Poll.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Poll deleted successfully',
            pollId: id
        });
    } catch (error) {
        console.error('Error deleting poll:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Optional: GET a specific poll
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        await dbConnect();

        const poll = await Poll.findById(id);

        if (!poll) {
            return NextResponse.json(
                { success: false, error: 'Poll not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            poll
        });
    } catch (error) {
        console.error('Error fetching poll:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}