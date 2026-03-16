import mongoose, { Schema, Document } from 'mongoose';

export enum LeaveStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

export interface ILeave extends Document {
    studentId: string;
    studentName: string;
    studentEnrollment: string;
    studentYear: string;
    hostelName: string;
    roomNo: string;
    leaveType: string;
    fromDate: Date;
    toDate: Date;
    reason: string;
    destination: string;
    parentContact: string;
    status: LeaveStatus;
    rejectionReason?: string;
    qrCodeToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const LeaveSchema: Schema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Admission', required: true },
    studentName: { type: String, required: true },
    studentEnrollment: { type: String, required: true },
    studentYear: { type: String, required: true },
    hostelName: { type: String, required: true },
    roomNo: { type: String, required: true },
    leaveType: { type: String, required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    destination: { type: String, required: true },
    parentContact: { type: String, required: true },
    status: {
        type: String,
        enum: Object.values(LeaveStatus),
        default: LeaveStatus.PENDING
    },
    rejectionReason: { type: String, default: '' },
    qrCodeToken: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model<ILeave>('Leave', LeaveSchema);
