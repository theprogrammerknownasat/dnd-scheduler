// src/models/Campaign.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
    name: string;
    description: string;
    users: string[]; // Array of usernames
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CampaignSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        users: { type: [String], default: [] },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);