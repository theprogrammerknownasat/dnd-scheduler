// src/app/api/auth/login/route.ts (updated to check for display name)
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        await dbConnect();
        const user = await User.findOne({ username, password });

        if (user) {
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

            // Check if user has a display name set
            const needsSetup = !user.displayName;

            return NextResponse.json({
                success: true,
                needsSetup
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Error in /api/auth/login:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}