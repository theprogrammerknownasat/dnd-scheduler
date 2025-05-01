// src/models/ScheduledSession.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IScheduledSession extends Document {
    campaignId: string;
    title: string;
    date: Date;
    startTime: number; // Hour (0-23)
    endTime: number; // Hour (0-23)
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const ScheduledSessionSchema: Schema = new Schema(
    {
        campaignId: { type: String, required: true },
        title: { type: String, required: true },
        date: { type: Date, required: true },
        startTime: { type: Number, required: true, min: 0, max: 23 },
        endTime: { type: Number, required: true, min: 0, max: 23 },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

// Create a compound index on campaignId and date for faster lookups
ScheduledSessionSchema.index({ campaignId: 1, date: 1 });

export default mongoose.models.ScheduledSession ||
mongoose.model<IScheduledSession>('ScheduledSession', ScheduledSessionSchema);