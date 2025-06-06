// src/models/Availability.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailability extends Document {
    username: string;
    campaignId: string;
    date: Date;
    timeSlots: Record<string, boolean>; // Changed from number to string to support half-hour slots
    createdAt: Date;
    updatedAt: Date;
}

const AvailabilitySchema: Schema = new Schema(
    {
        username: { type: String, required: true },
        campaignId: { type: String, required: true },
        date: { type: Date, required: true },
        timeSlots: { type: Map, of: Boolean, default: {} },
    },
    { timestamps: true }
);

// Create a compound index on username, campaignId, and date
AvailabilitySchema.index({ username: 1, campaignId: 1, date: 1 }, { unique: true });

export default mongoose.models.Availability || mongoose.model<IAvailability>('Availability', AvailabilitySchema);