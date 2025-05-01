import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import User from '@/models/User';

// Get all users for a campaign
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Find the campaign
        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Check if user has access to this campaign
        if (!campaign.users.includes(username)) {
            const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

            if (!isAdmin) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized' },
                    { status: 403 }
                );
            }
        }

        // Get all users for this campaign
        const users = await User.find(
            { username: { $in: campaign.users } },
            { username: 1, displayName: 1, _id: 1 }
        );

        return NextResponse.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error in /api/campaigns/[id]/users (GET):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}