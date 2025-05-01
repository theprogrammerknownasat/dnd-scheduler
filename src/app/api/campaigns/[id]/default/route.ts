import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';

// Set a campaign as default (admin only)
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        await dbConnect();

        // Find the campaign to set as default
        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Clear default flag on all campaigns
        await Campaign.updateMany({}, { isDefault: false });

        // Set the current campaign as default
        campaign.isDefault = true;
        await campaign.save();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/campaigns/[id]/default (POST):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}