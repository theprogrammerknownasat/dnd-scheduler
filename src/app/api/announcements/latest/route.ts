// src/app/api/announcements/latest/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getAnnouncementPath = () => path.join(process.cwd(), 'data', 'announcement.json');

const getAnnouncement = () => {
    try {
        // Check if the announcement file exists
        if (!fs.existsSync(getAnnouncementPath())) {
            return { text: '' };
        }

        return JSON.parse(fs.readFileSync(getAnnouncementPath(), 'utf-8'));
    } catch (error) {
        console.error('Error reading announcement:', error);
        return { text: '' };
    }
};

// Get latest announcement
export async function GET() {
    try {
        const announcement = getAnnouncement();

        return NextResponse.json({
            success: true,
            announcement: announcement.text
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}