// src/app/api/auth/check-username/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In a real app, this would be your database
// For now, we'll use a JSON file to store users
const getUsersPath = () => path.join(process.cwd(), 'data', 'users.json');

const getUsers = () => {
    try {
        // Make sure the data directory exists
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        // Check if the users file exists
        if (!fs.existsSync(getUsersPath())) {
            // Create a default users file with an admin user
            const defaultUsers = [
                {
                    username: 'admin',
                    password: null, // Will need to be set on first login
                    isAdmin: true
                }
            ];
            fs.writeFileSync(getUsersPath(), JSON.stringify(defaultUsers, null, 2));
            return defaultUsers;
        }

        const users = JSON.parse(fs.readFileSync(getUsersPath(), 'utf-8'));
        return users;
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
};

export async function POST(request: Request) {
    try {
        const { username } = await request.json();
        const users = getUsers();

        const user = users.find((u: any) => u.username === username);

        if (user) {
            return NextResponse.json({
                exists: true,
                hasPassword: !!user.password, // Convert to boolean
            });
        } else {
            return NextResponse.json({ exists: false });
        }
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}