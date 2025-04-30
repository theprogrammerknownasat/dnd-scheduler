// src/app/api/auth/create-password/route.ts
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

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        const users = getUsers();

        const userIndex = users.findIndex((u: any) => u.username === username);

        if (userIndex !== -1) {
            // Update the user's password
            users[userIndex].password = password;

            if (saveUsers(users)) {
                // Set cookies
                const cookieStore = await cookies();
                cookieStore.set('user', username, {
                    secure: process.env.NODE_ENV === 'production',
                    httpOnly: true,
                    maxAge: 60 * 60 * 24 * 7, // 1 week
                    path: '/',
                });
                cookieStore.set('isAdmin', users[userIndex].isAdmin ? 'true' : 'false', {
                    secure: process.env.NODE_ENV === 'production',
                    httpOnly: true,
                    maxAge: 60 * 60 * 24 * 7, // 1 week
                    path: '/',
                });

                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json(
                    { success: false, error: 'Could not save password' },
                    { status: 500 }
                );
            }
        } else {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}