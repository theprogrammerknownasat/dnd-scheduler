import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';

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

        const { text, color } = await request.json();

        await dbConnect();

        // Deactivate all existing announcements
        await Announcement.updateMany({}, { isActive: false });

        // Create new announcement
        if (text) {
            await Announcement.create({
                text,
                color: color || 'yellow',
                isActive: true
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/announcements:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
