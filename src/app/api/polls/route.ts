// src/app/api/polls/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this: npm install uuid @types/uuid

const getPollsPath = () => path.join(process.cwd(), 'data', 'polls.json');

const getPolls = () => {
    try {
        // Make sure the data directory exists
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        // Check if the polls file exists
        if (!fs.existsSync(getPollsPath())) {
            // Create an empty polls file
            fs.writeFileSync(getPollsPath(), JSON.stringify([]));
            return [];
        }

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

// Get all polls
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

        const polls = getPolls();

        return NextResponse.json({
            success: true,
            polls
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a new poll (admin only)
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

        const { question, options } = await request.json();

        if (!question || !options || options.length < 2) {
            return NextResponse.json(
                { success: false, error: 'Invalid poll data' },
                { status: 400 }
            );
        }

        const polls = getPolls();

        // Create new poll
        const newPoll = {
            id: uuidv4(),
            question,
            options,
            votes: {}
        };

        polls.push(newPoll);

        if (savePolls(polls)) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'Could not save poll' },
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

// Delete a poll (admin only)
export async function DELETE(request: Request) {
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

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Poll ID is required' },
                { status: 400 }
            );
        }

        const polls = getPolls();

        const updatedPolls = polls.filter((poll: any) => poll.id !== id);

        if (updatedPolls.length === polls.length) {
            return NextResponse.json(
                { success: false, error: 'Poll not found' },
                { status: 404 }
            );
        }

        if (savePolls(updatedPolls)) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'Could not delete poll' },
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