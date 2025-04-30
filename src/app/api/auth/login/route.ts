// src/app/api/auth/login/route.ts
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

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        const users = getUsers();

        const user = users.find((u: any) =>
            u.username === username && u.password === password
        );

        if (user) {
            // In a real app, you'd want to use a more secure method
            // Like JWT tokens, but for simplicity we'll use cookies
            const cookieStore = await cookies();
            cookieStore.set('user', username, {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });
            cookieStore.set('isAdmin', user.isAdmin ? 'true' : 'false', {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 7, // 1 week
                path: '/',
            });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}