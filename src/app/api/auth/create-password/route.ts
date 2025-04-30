import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        await dbConnect();
        const user = await User.findOne({ username });

        if (user) {
            // Update the user's password
            user.password = password;
            await user.save();

            // Set cookies
            const cookieStore = await cookies();
            cookieStore.set('user', username, {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });
            cookieStore.set('isAdmin', user.isAdmin ? 'true' : 'false', {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Error in /api/auth/create-password:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
