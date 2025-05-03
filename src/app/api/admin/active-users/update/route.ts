// src/app/api/admin/active-users/update/route.ts
import { NextResponse } from 'next/server';
import { updateActiveUser } from '../route';

export async function GET(request: Request) {
    try {
        // Get the username from the query string
        const url = new URL(request.url);
        const username = url.searchParams.get('username');

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Username is required' },
                { status: 400 }
            );
        }

        // Update the active user (using the function from the parent route)
        updateActiveUser(username);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating active user:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}