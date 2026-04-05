import mongoose, { Schema, Document } from 'mongoose';

export interface IHostelExit extends Document {
    studentId: string;
    studentName: string;
    enrollmentNo: string;
    hostelName: string;
    roomNo: string;
    bedNumber: string;
    exitDate: Date;
    reason: string;
    exitAssets: { name: string, count: number, damagedCount: number, condition: string }[];
    status: 'pending' | 'approved' | 'rejected';
    wardenRemark: string;
    createdAt: Date;
}

const HostelExitSchema: Schema = new Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    enrollmentNo: { type: String, required: true },
    hostelName: { type: String, required: true },
    roomNo: { type: String, required: true },
    bedNumber: { type: String, required: true },
    exitDate: { type: Date, required: true },
    reason: { type: String, required: true },
    exitAssets: [{
        name: { type: String },
        count: { type: Number },
        damagedCount: { type: Number },
        condition: { type: String }
    }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    wardenRemark: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IHostelExit>('HostelExit', HostelExitSchema);
