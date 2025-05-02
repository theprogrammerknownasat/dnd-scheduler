// src/app/api/auth/check-username/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
    try {
        const { username } = await request.json();

        await dbConnect();
        const user = await User.findOne({ username });

        if (user) {
            return NextResponse.json({
                exists: true,
                hasPassword: !!user.password,
            });
        } else {
            return NextResponse.json({ exists: false });
        }
    } catch (error) {
        console.error('Error in /api/auth/check-username:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}