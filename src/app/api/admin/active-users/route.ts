import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In a real app, you'd use a database or Redis for this
// For now, we'll use a global variable
let activeUsers: Record<string, { lastActive: number }> = {};

// Update active user (called from middleware)
export function updateActiveUser(username: string) {
    activeUsers[username] = { lastActive: Date.now() };
    cleanupInactiveUsers();
}

// Clean up inactive users (30 minute timeout)
function cleanupInactiveUsers() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    Object.keys(activeUsers).forEach(username => {
        if (now - activeUsers[username].lastActive > timeout) {
            delete activeUsers[username];
        }
    });
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
        console.error('Error in /api/admin/active-users:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}