// src/models/Announcement.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
    text: string;
    color: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema(
    {
        text: { type: String, required: true },
        color: { type: String, default: 'yellow' }, // yellow, red, green, blue
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
