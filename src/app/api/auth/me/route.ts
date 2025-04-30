// src/app/api/auth/me/route.ts
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

export async function GET() {
    try {
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const users = getUsers();
        const user = users.find((u: any) => u.username === username);

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            username: user.username,
            isAdmin
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}