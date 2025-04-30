import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();

        // Clear cookies
        cookieStore.delete('user');
        cookieStore.delete('isAdmin');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/auth/logout:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}