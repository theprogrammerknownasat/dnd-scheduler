// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Update user (admin only)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { username, displayName, password, contactRequested } = body;

        // If this is just a contact request dismiss, handle it separately
        if ('contactRequested' in body && Object.keys(body).length === 1) {
            await dbConnect();
            const user = await User.findByIdAndUpdate(
                id,
                { contactRequested },
                { new: true }
            );

            if (!user) {
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true });
        }

        // Original logic for full user updates
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

        // Update display name if provided
        if (displayName !== undefined) {
            user.displayName = displayName;
        }

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

