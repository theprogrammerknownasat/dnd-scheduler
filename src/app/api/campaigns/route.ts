// src/app/api/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import Campaign from '@/models/Campaign';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function GET() {
    try {
        // Get the username and isAdmin status from cookies
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!username) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        // Connect to the database
        await dbConnect();

        let campaigns = [];

        // Check if user exists
        const user = await User.findOne({ username });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        if (isAdmin) {
            // Admin can see all campaigns
            campaigns = await Campaign.find().sort({ name: 1 });
        } else {
            // Regular user can only see campaigns they're a part of
            if (user.campaigns && user.campaigns.length > 0) {
                const campaignIds = user.campaigns.map((id: string) => {
                    try {
                        return new mongoose.Types.ObjectId(id);
                    } catch {
                        return null;
                    }
                }).filter(Boolean);

                campaigns = await Campaign.find({
                    _id: { $in: campaignIds }
                }).sort({ name: 1 });
            }
        }

        return NextResponse.json({ success: true, campaigns });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch campaigns'
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Get the username and isAdmin status from cookies
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;
        const isAdmin = cookieStore.get('isAdmin')?.value === 'true';

        if (!username) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        // Connect to the database
        await dbConnect();

        // Only admins can create campaigns
        if (!isAdmin) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        // Get campaign data from the request body
        const data = await req.json();

        // Validate required fields
        if (!data.name) {
            return NextResponse.json({
                success: false,
                error: 'Campaign name is required'
            }, { status: 400 });
        }

        // Create new campaign
        const newCampaign = new Campaign({
            name: data.name,
            description: data.description || '',
            users: [username], // Include the creator
        });

        const savedCampaign = await newCampaign.save();

        // Add campaign to admin's campaigns list
        await User.findOneAndUpdate(
            { username },
            { $push: { campaigns: savedCampaign._id.toString() } }
        );

        return NextResponse.json({
            success: true,
            campaign: savedCampaign
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to create campaign'
        }, { status: 500 });
    }
}