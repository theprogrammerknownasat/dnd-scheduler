import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Get all users (admin only)
export async function GET() {
    try {
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        await dbConnect();
        const users = await User.find({}).select('-__v');

        return NextResponse.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error in /api/admin/users (GET):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Add a new user (admin only)
export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { username } = await request.json();

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Username is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'Username already exists' },
                { status: 400 }
            );
        }

        // Add new user
        await User.create({
            username,
            password: null, // Will be set on first login
            isAdmin: false  // Regular user by default
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/admin/users (POST):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete a user (admin only)
export async function DELETE(request: Request) {
    try {
        const cookieStore = await cookies();
        const currentUsername = cookieStore.get('user')?.value;
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Username is required' },
                { status: 400 }
            );
        }

        // Prevent admin from deleting their own account
        if (username === currentUsername) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find the user to check if they're an admin
        const user = await User.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent deleting admin accounts
        if (user.isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete admin accounts' },
                { status: 400 }
            );
        }

        // Delete the user
        await User.deleteOne({ username });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/admin/users (DELETE):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}