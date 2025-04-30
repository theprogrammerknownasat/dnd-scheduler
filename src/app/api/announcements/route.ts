// src/app/api/announcements/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

const getAnnouncementPath = () => path.join(process.cwd(), 'data', 'announcement.json');

const getAnnouncement = () => {
    try {
        // Make sure the data directory exists
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        // Check if the announcement file exists
        if (!fs.existsSync(getAnnouncementPath())) {
            // Create an empty announcement file
            fs.writeFileSync(getAnnouncementPath(), JSON.stringify({ text: '' }));
            return { text: '' };
        }

        return JSON.parse(fs.readFileSync(getAnnouncementPath(), 'utf-8'));
    } catch (error) {
        console.error('Error reading announcement:', error);
        return { text: '' };
    }
};

const saveAnnouncement = (text: string) => {
    try {
        fs.writeFileSync(getAnnouncementPath(), JSON.stringify({ text }));
        return true;
    } catch (error) {
        console.error('Error saving announcement:', error);
        return false;
    }
};

// Update announcement (admin only)
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

        const { announcement } = await request.json();

        if (saveAnnouncement(announcement)) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: 'Could not save announcement' },
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