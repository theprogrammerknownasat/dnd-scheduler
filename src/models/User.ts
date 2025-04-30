import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    password: string | null;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        username: { type: String, required: true, unique: true },
        password: { type: String, default: null },
        isAdmin: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);