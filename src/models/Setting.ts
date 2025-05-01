// src/models/Setting.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
    key: string;
    maxFutureWeeks: number;
    disableDisplayNameEditing: boolean;
    displayNameFilter: string;
    createdAt: Date;
    updatedAt: Date;
}

const SettingSchema: Schema = new Schema(
    {
        key: { type: String, required: true, unique: true },
        maxFutureWeeks: { type: Number, default: 12 },
        disableDisplayNameEditing: { type: Boolean, default: false },
        displayNameFilter: { type: String, default: '' },
    },
    { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);