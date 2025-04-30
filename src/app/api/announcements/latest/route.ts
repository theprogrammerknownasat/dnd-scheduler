import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';

export async function GET() {
    try {
        await dbConnect();

        // Get the latest active announcement
        const announcement = await Announcement.findOne({ isActive: true })
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            announcement: announcement ? {
                text: announcement.text,
                color: announcement.color
            } : { text: '', color: 'yellow' }
        });
    } catch (error) {
        console.error('Error in /api/announcements/latest:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}