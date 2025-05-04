// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    displayName: string;
    password: string | null;
    isAdmin: boolean;
    campaigns: string[]; // Array of campaign IDs
    use24HourFormat: boolean;
    displayNameEditDisabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        username: { type: String, required: true, unique: true },
        displayName: { type: String, default: '' },
        password: { type: String, default: null },
        isAdmin: { type: Boolean, default: false },
        campaigns: { type: [String], default: [] },
        use24HourFormat: { type: Boolean, default: false },
        displayNameEditDisabled: { type: Boolean, default: false },
        contactRequested: { type: Boolean, default: false }
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);