// src/app/api/admin/active-users/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In-memory storage for active users
// This will reset when the server restarts, but it's Edge Runtime compatible
let activeUsers: Record<string, { lastActive: number }> = {};

// Update active user (called from middleware)
export function updateActiveUser(username: string) {
    // Store the user with current timestamp
    activeUsers[username] = { lastActive: Date.now() };

    // Log with a visible marker for debugging
    console.log(`⭐⭐⭐ ACTIVE USER TRACKED: ${username} at ${new Date().toLocaleTimeString()} ⭐⭐⭐`);

    // Log the current list of active users
    const activeUsersList = Object.keys(activeUsers);
    console.log(`📊 ACTIVE USERS (${activeUsersList.length}): ${activeUsersList.join(', ')}`);

    // Clean up inactive users
    cleanupInactiveUsers();

    return true;
}

// Clean up inactive users (10 minute timeout)
function cleanupInactiveUsers() {
    const now = Date.now();
    const timeout = 10 * 60 * 1000; // 10 minutes

    // Filter out inactive users
    Object.keys(activeUsers).forEach(username => {
        if (now - activeUsers[username].lastActive > timeout) {
            console.log(`Removing inactive user: ${username}`);
            delete activeUsers[username];
        }
    });
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        console.log(`🔍 CHECKING ACTIVE USERS, admin access: ${isAdmin ? 'YES' : 'NO'}`);

        if (!isAdmin) {
            console.log("⛔ Unauthorized attempt to view active users");
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Clean up before fetching
        cleanupInactiveUsers();

        // Get all active usernames
        const usernames = Object.keys(activeUsers);

        // Log the list
        console.log(`📊 SENDING ACTIVE USERS (${usernames.length}): ${usernames.join(', ')}`);

        return NextResponse.json({
            success: true,
            activeUsers: usernames
        });
    } catch (error) {
        console.error('Error in /api/admin/active-users:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}