// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
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

        await dbConnect();
        const user = await User.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            username: user.username,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}