// src/app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function GET() {
    try {
        // Get cookies
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;
        if (!username) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        // Connect to database to get additional user info if needed
        await dbConnect();
        const user = await User.findOne({ username });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        // Return user info
        return NextResponse.json({
            success: true,
            username: user.username,
            displayName: user.displayName || username,
            isAdmin: user.isAdmin,
            // Include this to make it compatible with the session approach
            session: {
                user: {
                    username: user.username,
                    isAdmin: user.isAdmin
                }
            }
        });
    } catch (error) {
        console.error('Error in /api/auth/me:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}