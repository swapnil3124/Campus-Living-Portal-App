import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmission extends Document {
    fullName: string;
    enrollment: string;
    email: string;
    phone: string;
    department: string;
    year: string;
    prevMarks: string;
    category: string;
    gender: string;
    additionalData: Record<string, any>;
    status: 'pending' | 'verified' | 'accepted' | 'rejected';
    appliedAt: Date;
    photoUrl?: string;
    studentPassword?: string;
    isRoomAllocated?: boolean;
    allocatedHostel?: string;
    allocatedRoom?: string;
    allocatedBed?: number;
    feeStatus?: 'paid' | 'pending' | 'partial';
}

const AdmissionSchema: Schema = new Schema({
    fullName: { type: String, default: '' },
    enrollment: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    department: { type: String, default: '' },
    year: { type: String, default: '' },
    prevMarks: { type: String, default: '' },
    category: { type: String, default: '' },
    gender: { type: String, default: '' },
    additionalData: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['pending', 'verified', 'accepted', 'rejected'], default: 'pending' },
    appliedAt: { type: Date, default: Date.now },
    photoUrl: { type: String },
    studentPassword: { type: String },
    isRoomAllocated: { type: Boolean, default: false },
    allocatedHostel: { type: String },
    allocatedRoom: { type: String },
    allocatedBed: { type: Number },
    feeStatus: { type: String, enum: ['paid', 'pending', 'partial'], default: 'pending' }
}, { strict: false });

const Admission = mongoose.models.Admission || mongoose.model<IAdmission>('Admission', AdmissionSchema);
export default Admission;
