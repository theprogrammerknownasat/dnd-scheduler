// src/app/api/polls/vote/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

const getPollsPath = () => path.join(process.cwd(), 'data', 'polls.json');

const getPolls = () => {
    try {
        return JSON.parse(fs.readFileSync(getPollsPath(), 'utf-8'));
    } catch (error) {
        console.error('Error reading polls:', error);
        return [];
    }
};

const savePolls = (polls: any[]) => {
    try {
        fs.writeFileSync(getPollsPath(), JSON.stringify(polls, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving polls:', error);
        return false;
    }
};

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

        const polls = getPolls();

        const pollIndex = polls.findIndex((poll: any) => poll.id === pollId);

        if (pollIndex === -1) {
            return NextResponse.json(
                { success: false, error: 'Poll not found' },
                { status: 404 }
            );
        }

        // Check if the option is valid
        if (!polls[pollIndex].options.includes(option)) {
            return NextResponse.json(
                { success: false, error: 'Invalid option' },
                { status: 400 }
            );
        }

        // Record the vote
        polls[pollIndex].votes[username] = option;

        if (savePolls(polls)) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'Could not save vote' },
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