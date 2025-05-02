// src/lib/dbInit.ts
import dbConnect from './mongodb';
import User from '@/models/User';

/**
 * Initialize the database and ensure an admin user exists
 */
export async function initDatabase() {
    try {
        // Connect to the database
        await dbConnect();
        console.log('Connected to MongoDB database');

        // Check if admin user exists
        const adminExists = await User.findOne({ username: 'admin' });

        if (!adminExists) {
            console.log('Admin user not found, creating default admin...');

            // Create admin user
            await User.create({
                username: 'admin',
                displayName: 'Admin',
                password: null, // Will need to set a password on first login
                isAdmin: true,
                campaigns: [],
                use24HourFormat: false,
                displayNameEditDisabled: false
            });

            console.log('Default admin user created successfully');
        } else {
            console.log('Admin user exists, skipping creation');
        }

        return { success: true };
    } catch (error) {
        console.error('Database initialization error:', error);
        return { success: false, error };
    }
}

export default initDatabase;