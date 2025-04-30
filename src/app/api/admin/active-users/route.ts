// src/app/api/admin/active-users/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In a real app, you'd store active users in a database or Redis
// For simplicity, we'll use a global variable
let activeUsers: Record<string, { lastActive: number }> = {};

// Clean up inactive users (30 minute timeout)
const cleanupInactiveUsers = () => {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    Object.keys(activeUsers).forEach(username => {
        if (now - activeUsers[username].lastActive > timeout) {
            delete activeUsers[username];
        }
    });
};

// Update active user
export function updateActiveUser(username: string) {
    activeUsers[username] = { lastActive: Date.now() };
    cleanupInactiveUsers();
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        cleanupInactiveUsers();

        return NextResponse.json({
            success: true,
            activeUsers: Object.keys(activeUsers)
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}