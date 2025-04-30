import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Update user (admin only)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { username, password } = await request.json();

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Username is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find the user to update
        const user = await User.findById(id);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if the new username already exists (if it's different)
        if (username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return NextResponse.json(
                    { success: false, error: 'Username already exists' },
                    { status: 400 }
                );
            }
        }

        // Update user fields
        user.username = username;

        // Only update password if provided
        if (password) {
            user.password = password;
        }

        await user.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/admin/users/[id] (PUT):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}