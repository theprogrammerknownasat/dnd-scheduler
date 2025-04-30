// src/models/Poll.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPoll extends Document {
    question: string;
    options: string[];
    votes: Record<string, string>;
    isBlind: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const PollSchema: Schema = new Schema(
    {
        question: { type: String, required: true },
        options: { type: [String], required: true },
        votes: { type: Map, of: String, default: {} },
        isBlind: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.models.Poll || mongoose.model<IPoll>('Poll', PollSchema);
