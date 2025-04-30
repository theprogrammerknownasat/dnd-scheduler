// src/models/Setting.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
    key: string;
    value: any;
    createdAt: Date;
    updatedAt: Date;
}

const SettingSchema: Schema = new Schema(
    {
        key: { type: String, required: true, unique: true },
        value: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);