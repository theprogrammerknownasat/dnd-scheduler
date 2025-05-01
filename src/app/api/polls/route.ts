// src/app/api/polls/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Poll from '@/models/Poll';

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

        await dbConnect();

        // Get all active polls
        const polls = await Poll.find({ isActive: true }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            polls
        });
    } catch (error) {
        console.error('Error in /api/polls (GET):', error);
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

        const { question, options, isBlind } = await request.json();

        if (!question || !options || options.length < 2) {
            return NextResponse.json(
                { success: false, error: 'Question and at least 2 options are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Create new poll
        await Poll.create({
            question,
            options,
            votes: {},
            isBlind: !!isBlind,
            isActive: true
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/polls (POST):', error);
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
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Poll ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        await Poll.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/polls (DELETE):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
