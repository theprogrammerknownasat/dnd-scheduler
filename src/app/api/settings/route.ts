// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        // Connect to the database
        await dbConnect();

        // Fetch global settings
        const settings = await Setting.findOne({ key: 'global' });

        return NextResponse.json({
            success: true,
            settings: settings || {
                maxFutureWeeks: 12,
                disableDisplayNameEditing: false,
                displayNameFilter: ''
            }
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch settings'
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get the admin status from cookies
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!username || !isAdmin) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        // Connect to the database
        await dbConnect();

        // Verify that the user is actually an admin
        const user = await User.findOne({ username });

        if (!user || !user.isAdmin) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        // Get settings from the request body
        const data = await req.json();

        // Validate and sanitize the data
        const settingsToUpdate: any = {};

        if (typeof data.maxFutureWeeks === 'number' && data.maxFutureWeeks > 0) {
            settingsToUpdate.maxFutureWeeks = data.maxFutureWeeks;
        }

        if (typeof data.disableDisplayNameEditing === 'boolean') {
            settingsToUpdate.disableDisplayNameEditing = data.disableDisplayNameEditing;
        }

        if (data.displayNameFilter !== undefined) {
            settingsToUpdate.displayNameFilter = data.displayNameFilter;
        }

        // Update or create settings
        await Setting.findOneAndUpdate(
            { key: 'global' },
            { $set: settingsToUpdate },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update settings'
        }, { status: 500 });
    }
}