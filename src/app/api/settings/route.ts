import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Setting from '@/models/Setting';

// Get all settings
export async function GET() {
    try {
        await dbConnect();

        // Get all settings
        const settings: Record<string, any> = {};

        const allSettings = await Setting.find({});
        allSettings.forEach((setting) => {
            settings[setting.key] = setting.value;
        });

        // Set default values if not found
        if (!settings.maxFutureWeeks) {
            settings.maxFutureWeeks = 12;
        }

        return NextResponse.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error('Error in /api/settings (GET):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update settings (admin only)
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

        const settings = await request.json();

        await dbConnect();

        // Update each setting
        for (const [key, value] of Object.entries(settings)) {
            await Setting.findOneAndUpdate(
                { key },
                { key, value },
                { upsert: true } // Create if not exists
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/settings (POST):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}