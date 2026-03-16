import mongoose, { Schema, Document } from 'mongoose';

export enum ComplaintStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in-progress',
    RESOLVED = 'resolved'
}

export enum ComplaintPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export interface IComplaint extends Document {
    studentId: string;
    studentName: string;
    studentEnrollment: string;
    hostelName: string;
    roomNumber: string;
    type: string; // e.g., Plumbing, Electrical, etc.
    priority: ComplaintPriority;
    description: string;
    status: ComplaintStatus;
    wardenRemark?: string;
    wardenId?: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ComplaintSchema: Schema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Admission', required: true },
    studentName: { type: String, required: true },
    studentEnrollment: { type: String, required: true },
    hostelName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    type: { type: String, required: true },
    priority: { 
        type: String, 
        enum: Object.values(ComplaintPriority), 
        default: ComplaintPriority.MEDIUM 
    },
    description: { type: String, required: true },
    status: { 
        type: String, 
        enum: Object.values(ComplaintStatus), 
        default: ComplaintStatus.PENDING 
    },
    wardenRemark: { type: String, default: '' },
    wardenId: { type: String, default: null },
    imageUrl: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model<IComplaint>('Complaint', ComplaintSchema);
