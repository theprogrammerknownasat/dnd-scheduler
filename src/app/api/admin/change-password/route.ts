import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!username || !isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { success: false, error: 'Current and new passwords are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find the admin user
        const user = await User.findOne({ username, isAdmin: true });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Admin user not found' },
                { status: 404 }
            );
        }

        // Verify current password
        if (user.password !== currentPassword) {
            return NextResponse.json(
                { success: false, error: 'Current password is incorrect' },
                { status: 401 }
            );
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/admin/change-password:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}