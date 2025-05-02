// src/app/api/polls/vote/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Poll from '@/models/Poll';
import Campaign from '@/models/Campaign';

// Vote on a poll
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

        const { pollId, option, campaignId } = await request.json();

        if (!pollId || !option || !campaignId) {
            return NextResponse.json(
                { success: false, error: 'Poll ID, campaign ID, and option are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find the poll
        const poll = await Poll.findById(pollId);

        if (!poll) {
            return NextResponse.json(
                { success: false, error: 'Poll not found' },
                { status: 404 }
            );
        }

        // Verify poll belongs to the specified campaign
        if (poll.campaignId !== campaignId) {
            return NextResponse.json(
                { success: false, error: 'Poll does not belong to the specified campaign' },
                { status: 403 }
            );
        }

        // Verify user has access to this campaign
        const campaign = await Campaign.findById(campaignId);
        if (!campaign || !campaign.users.includes(username)) {
            const isAdmin = cookieStore.get('isAdmin')?.value === 'true';
            if (!isAdmin) {
                return NextResponse.json(
                    { success: false, error: 'User does not have access to this campaign' },
                    { status: 403 }
                );
            }
        }

        // Check if the option is valid
        if (!poll.options.includes(option)) {
            return NextResponse.json(
                { success: false, error: 'Invalid option' },
                { status: 400 }
            );
        }

        // Record the vote
        const votes = poll.votes.toJSON();
        votes[username] = option;
        poll.votes = votes;

        await poll.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/polls/vote:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}