import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Poll from '@/models/Poll';

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

        const { pollId, option } = await request.json();

        if (!pollId || !option) {
            return NextResponse.json(
                { success: false, error: 'Poll ID and option are required' },
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
