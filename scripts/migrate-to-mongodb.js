// scripts/migrate-to-mongodb.js
/**
 * Migration script to move data from JSON files to MongoDB
 *
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Run: node scripts/migrate-to-mongodb.js
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// MongoDB connection string - update this to your actual MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dnd-scheduler';

// Paths to JSON files
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const AVAILABILITY_PATH = path.join(DATA_DIR, 'availability.json');
const ANNOUNCEMENT_PATH = path.join(DATA_DIR, 'announcement.json');
const POLLS_PATH = path.join(DATA_DIR, 'polls.json');

// Function to read JSON file
function readJsonFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
        return null;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return null;
    }
}

// Function to connect to MongoDB
async function connectToMongoDB() {
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('Connected to MongoDB');
        return client;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

// Main migration function
async function migrateToMongoDB() {
    let client;

    try {
        client = await connectToMongoDB();
        const db = client.db();

        // Migrate users
        const users = readJsonFile(USERS_PATH);
        if (users && users.length > 0) {
            console.log(`Migrating ${users.length} users...`);

            // Check if there are existing users
            const existingUsersCount = await db.collection('users').countDocuments();
            if (existingUsersCount > 0) {
                console.log('Users already exist in database, skipping migration');
            } else {
                // Add timestamps to users
                const usersWithTimestamps = users.map(user => ({
                    ...user,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                const result = await db.collection('users').insertMany(usersWithTimestamps);
                console.log(`${result.insertedCount} users migrated successfully`);
            }
        }

        // Migrate availability
        const availability = readJsonFile(AVAILABILITY_PATH);
        if (availability) {
            console.log('Migrating availability data...');

            const existingAvailabilityCount = await db.collection('availabilities').countDocuments();
            if (existingAvailabilityCount > 0) {
                console.log('Availability data already exists in database, skipping migration');
            } else {
                const availabilityRecords = [];

                // Convert from old format to new format
                for (const [username, userAvailability] of Object.entries(availability)) {
                    // Group by dates
                    const dateMap = {};

                    for (const [key, isAvailable] of Object.entries(userAvailability)) {
                        // Old format: "day-hour" (e.g., "Monday-8")
                        // Parse to new format with real dates
                        const [day, hour] = key.split('-');

                        // Create a date object for the day
                        // This creates a date for the next occurrence of that day
                        const date = getNextDayOfWeek(day);
                        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

                        if (!dateMap[dateStr]) {
                            dateMap[dateStr] = {};
                        }

                        dateMap[dateStr][hour] = isAvailable;
                    }

                    // Create availability records for each day
                    for (const [dateStr, timeSlots] of Object.entries(dateMap)) {
                        availabilityRecords.push({
                            username,
                            date: new Date(dateStr),
                            timeSlots,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                }

                if (availabilityRecords.length > 0) {
                    const result = await db.collection('availabilities').insertMany(availabilityRecords);
                    console.log(`${result.insertedCount} availability records migrated successfully`);
                } else {
                    console.log('No availability records to migrate');
                }
            }
        }

        // Migrate announcement
        const announcement = readJsonFile(ANNOUNCEMENT_PATH);
        if (announcement) {
            console.log('Migrating announcement...');

            const existingAnnouncementCount = await db.collection('announcements').countDocuments();
            if (existingAnnouncementCount > 0) {
                console.log('Announcements already exist in database, skipping migration');
            } else {
                // Create announcement record
                const announcementRecord = {
                    text: announcement.text || '',
                    color: 'yellow', // Default color
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await db.collection('announcements').insertOne(announcementRecord);
                console.log('Announcement migrated successfully');
            }
        }

        // Migrate polls
        const polls = readJsonFile(POLLS_PATH);
        if (polls && polls.length > 0) {
            console.log(`Migrating ${polls.length} polls...`);

            const existingPollsCount = await db.collection('polls').countDocuments();
            if (existingPollsCount > 0) {
                console.log('Polls already exist in database, skipping migration');
            } else {
                // Add timestamps and additional fields to polls
                const pollsWithTimestamps = polls.map(poll => ({
                    ...poll,
                    isBlind: false, // Default value
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }));

                const result = await db.collection('polls').insertMany(pollsWithTimestamps);
                console.log(`${result.insertedCount} polls migrated successfully`);
            }
        }

        // Create default settings
        const existingSettingsCount = await db.collection('settings').countDocuments();
        if (existingSettingsCount === 0) {
            console.log('Creating default settings...');

            await db.collection('settings').insertOne({
                key: 'maxFutureWeeks',
                value: 12,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('Default settings created successfully');
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('MongoDB connection closed');
        }
    }
}

// Helper function to get the next occurrence of a day
function getNextDayOfWeek(dayName) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayIndex = days.findIndex(d => d === dayName);

    if (dayIndex === -1) {
        throw new Error(`Invalid day name: ${dayName}`);
    }

    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    let daysToAdd = dayIndex - currentDayIndex;
    if (daysToAdd <= 0) {
        daysToAdd += 7; // Add a week to get the next occurrence
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    nextDate.setHours(0, 0, 0, 0); // Set to beginning of day

    return nextDate;
}

// Run the migration
migrateToMongoDB();