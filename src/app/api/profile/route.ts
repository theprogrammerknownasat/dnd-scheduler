// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Setting from '@/models/Setting';
import bcrypt from 'bcrypt';

export async function GET() {
    try {
        // Get the username from cookies
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;

        if (!username) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        // Connect to the database
        await dbConnect();

        // Fetch user profile
        const user = await User.findOne({ username });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        // Return user profile data
        return NextResponse.json({
            success: true,
            profile: {
                displayName: user.displayName || '',
                use24HourFormat: user.use24HourFormat || false,
                displayNameEditDisabled: user.displayNameEditDisabled || false
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch profile'
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Get the username from cookies
        const cookieStore = await cookies();
        const username = cookieStore.get('user')?.value;

        if (!username) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        // Connect to the database
        await dbConnect();

        // Get data from the request body
        const data = await req.json();

        // Fetch user and global settings
        const user = await User.findOne({ username });
        const settings = await Setting.findOne({ key: 'global' });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        // Process different profile update types
        const updateData: any = {};

        // Handle display name update
        if (data.displayName !== undefined) {
            // Check if display name editing is disabled globally
            if (settings?.disableDisplayNameEditing && user.displayName) {
                return NextResponse.json({
                    success: false,
                    error: 'Display name editing is currently disabled by admin'
                }, { status: 403 });
            }

            // Check for display name filter if it exists
            if (settings?.displayNameFilter && settings.displayNameFilter.length > 0) {
                const filterTerms = settings.displayNameFilter.split(',').map((term: string) => term.trim().toLowerCase());
                const displayNameLower = data.displayName.toLowerCase();

                // Check if display name contains any filtered terms
                const containsFilteredTerm = filterTerms.some((term: string) =>
                    displayNameLower.includes(term)
                );

                if (containsFilteredTerm) {
                    return NextResponse.json({
                        success: false,
                        error: 'Display name contains inappropriate content'
                    }, { status: 403 });
                }
            }

            updateData.displayName = data.displayName;
        }

        // Handle time format preference update
        if (data.use24HourFormat !== undefined) {
            updateData.use24HourFormat = Boolean(data.use24HourFormat);
        }

        // Handle password change
        if (data.currentPassword && data.newPassword) {
            // Check if current password is correct
            if (!user.password || !bcrypt.compareSync(data.currentPassword, user.password)) {
                return NextResponse.json({
                    success: false,
                    error: 'Incorrect current password'
                }, { status: 400 });
            }

            // Hash the new password
            updateData.password = bcrypt.hashSync(data.newPassword, 10);
        }

        // Update user profile
        if (Object.keys(updateData).length > 0) {
            await User.findOneAndUpdate(
                { username },
                { $set: updateData }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update profile'
        }, { status: 500 });
    }
}