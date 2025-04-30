// src/models/Availability.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAvailability extends Document {
    username: string;
    date: Date;
    timeSlots: Record<number, boolean>;
    createdAt: Date;
    updatedAt: Date;
}

const AvailabilitySchema: Schema = new Schema(
    {
        username: { type: String, required: true },
        date: { type: Date, required: true },
        timeSlots: { type: Map, of: Boolean, default: {} },
    },
    { timestamps: true }
);

// Create a compound index on username and date
AvailabilitySchema.index({ username: 1, date: 1 }, { unique: true });

export default mongoose.models.Availability || mongoose.model<IAvailability>('Availability', AvailabilitySchema);
