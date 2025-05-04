// scripts/export-from-mongodb.js
/**
 * Export script to save MongoDB data to JSON files
 *
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Run: node scripts/export-from-mongodb.js
 * 3. Data will be saved to the ./exports directory
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// MongoDB connection string - update this to your actual MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dnd-scheduler';

// Export directory
const EXPORT_DIR = path.join(process.cwd(), 'exports');

// Function to create export directory if it doesn't exist
function ensureExportDirectory() {
    if (!fs.existsSync(EXPORT_DIR)) {
        fs.mkdirSync(EXPORT_DIR, { recursive: true });
        console.log('Created exports directory');
    }
}

// Function to write JSON file
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Successfully wrote ${filePath}`);
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
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

// Main export function
async function exportFromMongoDB() {
    let client;

    try {
        ensureExportDirectory();

        client = await connectToMongoDB();
        const db = client.db();

        // Export users
        console.log('Exporting users...');
        const users = await db.collection('users').find({}).toArray();
        writeJsonFile(path.join(EXPORT_DIR, 'users.json'), users);

        // Export availability
        console.log('Exporting availability...');
        const availabilities = await db.collection('availabilities').find({}).toArray();
        writeJsonFile(path.join(EXPORT_DIR, 'availabilities.json'), availabilities);

        // Export announcements
        console.log('Exporting announcements...');
        const announcements = await db.collection('announcements').find({}).toArray();
        writeJsonFile(path.join(EXPORT_DIR, 'announcements.json'), announcements);

        // Export polls
        console.log('Exporting polls...');
        const polls = await db.collection('polls').find({}).toArray();
        writeJsonFile(path.join(EXPORT_DIR, 'polls.json'), polls);

        // Export campaigns
        console.log('Exporting campaigns...');
        const campaigns = await db.collection('campaigns').find({}).toArray();
        writeJsonFile(path.join(EXPORT_DIR, 'campaigns.json'), campaigns);

        // Export scheduled sessions
        console.log('Exporting scheduled sessions...');
        const sessions = await db.collection('scheduledsessions').find({}).toArray();
        writeJsonFile(path.join(EXPORT_DIR, 'scheduled-sessions.json'), sessions);

        // Export settings
        console.log('Exporting settings...');
        const settings = await db.collection('settings').find({}).toArray();
        writeJsonFile(path.join(EXPORT_DIR, 'settings.json'), settings);

        // Create a timestamp for this export
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        console.log('Creating timestamped export...');

        // Copy all files to timestamped directory
        const timestampedDir = path.join(EXPORT_DIR, `export-${timestamp}`);
        fs.mkdirSync(timestampedDir, { recursive: true });

        // Copy files to timestamped directory
        const files = fs.readdirSync(EXPORT_DIR);
        files.forEach(file => {
            if (file.endsWith('.json')) {
                fs.copyFileSync(
                    path.join(EXPORT_DIR, file),
                    path.join(timestampedDir, file)
                );
            }
        });

        console.log(`\nExport completed successfully! Files saved to:
- Current data: ${EXPORT_DIR}
- Timestamped backup: ${timestampedDir}`);

    } catch (error) {
        console.error('Error during export:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('MongoDB connection closed');
        }
    }
}

// Run the export
exportFromMongoDB();