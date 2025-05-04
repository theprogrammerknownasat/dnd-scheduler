// src/app/api/campaigns/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import User from '@/models/User';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            );
        }

        await dbConnect();

        let campaigns;

        if (isAdmin) {
            // Admin can see all campaigns
            campaigns = await Campaign.find({});
        } else {
            // Regular user can only see their assigned campaigns
            campaigns = await Campaign.find({ users: username });
        }

        return NextResponse.json({
            success: true,
            campaigns
        });
    } catch (error) {
        console.error('Error in /api/campaigns (GET):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Create a new campaign (admin only)
export async function POST(request: Request) {
    try {
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

        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Campaign name is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if campaign with this name already exists
        const existingCampaign = await Campaign.findOne({ name });

        if (existingCampaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign with this name already exists' },
                { status: 400 }
            );
        }

        // Check if this is the first campaign (make it default)
        const campaignCount = await Campaign.countDocuments({});
        const isDefault = campaignCount === 0;

        // Create new campaign
        const campaign = await Campaign.create({
            name,
            description: description || '',
            users: [username], // Admin is always included
            isDefault
        });

        // Add campaign to admin's list
        await User.findOneAndUpdate(
            { username },
            { $addToSet: { campaigns: campaign._id } }
        );

        return NextResponse.json({
            success: true,
            campaign
        });
    } catch (error) {
        console.error('Error in /api/campaigns (POST):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update a campaign (admin only)
export async function PUT(
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

        const { name, description, users } = await request.json();

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Campaign name is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find the campaign to update
        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Check if name is being changed and already exists
        if (name !== campaign.name) {
            const existingCampaign = await Campaign.findOne({ name });

            if (existingCampaign) {
                return NextResponse.json(
                    { success: false, error: 'Campaign with this name already exists' },
                    { status: 400 }
                );
            }
        }

        // Get previous users
        const previousUsers = campaign.users;

        // Update campaign
        campaign.name = name;
        campaign.description = description || '';

        // Make sure admin is always included in users
        if (users) {
            if (!users.includes(username)) {
                users.push(username);
            }
            campaign.users = users;
        }

        await campaign.save();

        // Update user-campaign relationships

        // Add campaign to new users
        if (users) {
            const addedUsers = users.filter((user: never) => !previousUsers.includes(user));

            for (const user of addedUsers) {
                await User.findOneAndUpdate(
                    { username: user },
                    { $addToSet: { campaigns: id } }
                );
            }

            // Remove campaign from users no longer in the list
            const removedUsers = previousUsers.filter((user: never) => !users.includes(user));

            for (const user of removedUsers) {
                await User.findOneAndUpdate(
                    { username: user },
                    { $pull: { campaigns: id } }
                );
            }
        }

        return NextResponse.json({
            success: true,
            campaign
        });
    } catch (error) {
        console.error('Error in /api/campaigns/[id] (PUT):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete a campaign (admin only)
export async function DELETE(
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

        // Find the campaign
        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Don't allow deleting the default campaign
        if (campaign.isDefault) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete the default campaign' },
                { status: 400 }
            );
        }

        // Get all users with this campaign
        const users = campaign.users;

        // Delete the campaign
        await Campaign.findByIdAndDelete(id);

        // Remove campaign from all users
        for (const user of users) {
            await User.findOneAndUpdate(
                { username: user },
                { $pull: { campaigns: id } }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/campaigns/[id] (DELETE):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
