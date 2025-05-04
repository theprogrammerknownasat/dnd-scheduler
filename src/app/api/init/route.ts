// src/app/api/init/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

let initialized = false;

export async function GET() {
    if (initialized) {
        return NextResponse.json({ success: true, message: 'Already initialized' });
    }

    try {
        // Connect to the database
        await dbConnect();
        console.log('Connected to MongoDB database');

        // Check if admin user exists
        const adminExists = await User.findOne({ username: 'admin' });

        if (!adminExists) {
            console.log('Admin user not found, creating default admin...');

            // Create admin user
            await User.create({
                username: 'admin',
                password: null, // Will need to set a password on first login
                isAdmin: true,
                campaigns: [],
                use24HourFormat: false,
                displayNameEditDisabled: false
            });

            console.log('Default admin user created successfully');
        } else {
            console.log('Admin user exists, skipping creation');
        }

        initialized = true;
        return NextResponse.json({ success: true, message: 'Database initialized' });
    } catch (error) {
        console.error('Database initialization error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to initialize database' },
            { status: 500 }
        );
    }
}