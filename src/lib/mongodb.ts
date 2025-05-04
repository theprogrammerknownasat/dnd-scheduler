// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Use a simple object to track the connection
const mongooseCache: MongooseCache = { conn: null, promise: null };

async function dbConnect() {
    if (!MONGODB_URI) {
        throw new Error('Please add your Mongo URI to .env.local');
    }

    if (mongooseCache.conn) {
        return mongooseCache.conn;
    }

    if (!mongooseCache.promise) {
        const opts = {
            bufferCommands: false,
        };

        mongooseCache.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    mongooseCache.conn = await mongooseCache.promise;
    return mongooseCache.conn;
}

export default dbConnect;