import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IStaff extends Document {
    staffId: string;
    password: string;
    role: 'rector' | 'admin' | 'warden' | 'contractor' | 'watchman';
    subRole?: string;
    name: string;
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const StaffSchema: Schema = new Schema({
    staffId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['rector', 'admin', 'warden', 'contractor', 'watchman'] },
    subRole: { type: String, default: null },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to hash password
StaffSchema.pre('save', async function (this: IStaff) {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err: any) {
        throw err;
    }
});

// Method to compare password
StaffSchema.methods.comparePassword = function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IStaff>('Staff', StaffSchema);
