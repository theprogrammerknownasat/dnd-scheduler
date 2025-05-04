// src/models/ScheduledSession.ts
import mongoose, { Document } from 'mongoose';

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

const ScheduledSessionSchema = new mongoose.Schema({
    campaignId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    date: {
        type: String, // 'YYYY-MM-DD' format
        required: true
    },
    startTime: {
        type: Number, // hour of day (0-23)
        required: true
    },
    endTime: {
        type: Number, // hour of day (0-23)
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    createdBy: {
        type: String, // username who created the session
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Recurring session fields
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringDays: {
        type: Number, // number of days between sessions
        default: 0
    },
    recurringGroupId: {
        type: String, // to link recurring sessions together
        default: null
    },
    recurringIndex: {
        type: Number, // index in the recurring series (0 for first session)
        default: 0
    },
    maxRecurrences: {
        type: Number, // total number of sessions in the recurring series
        default: 0
    }
});


// Create a compound index on campaignId and date for faster lookups
ScheduledSessionSchema.index({ campaignId: 1, date: 1 });

export default mongoose.models.ScheduledSession ||
mongoose.model<IScheduledSession>('ScheduledSession', ScheduledSessionSchema);