// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

const getUsersPath = () => path.join(process.cwd(), 'data', 'users.json');

const getUsers = () => {
    try {
        return JSON.parse(fs.readFileSync(getUsersPath(), 'utf-8'));
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
};

const saveUsers = (users: any[]) => {
    try {
        fs.writeFileSync(getUsersPath(), JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
};

// Get all users (admin only)
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

        const users = getUsers();

        return NextResponse.json({
            success: true,
            users
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Add a new user (admin only)
export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const { username, isAdmin: newUserIsAdmin } = await request.json();

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Username is required' },
                { status: 400 }
            );
        }

        const users = getUsers();

        // Check if username already exists
        if (users.some((u: any) => u.username === username)) {
            return NextResponse.json(
                { success: false, error: 'Username already exists' },
                { status: 400 }
            );
        }

        // Add new user
        users.push({
            username,
            password: null, // Will be set on first login
            isAdmin: !!newUserIsAdmin // Convert to boolean
        });

        if (saveUsers(users)) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'Could not save user' },
                { status: 500 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete a user (admin only)
export async function DELETE(request: Request) {
    try {
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';
        const currentUsername = cookieStore.get('user')?.value;

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const url = new URL(request.url);
        const username = url.searchParams.get('username');

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Username is required' },
                { status: 400 }
            );
        }

        // Prevent admin from deleting their own account
        if (username === currentUsername) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        const users = getUsers();

        const updatedUsers = users.filter((u: any) => u.username !== username);

        if (updatedUsers.length === users.length) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        if (saveUsers(updatedUsers)) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'Could not delete user' },
                { status: 500 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}