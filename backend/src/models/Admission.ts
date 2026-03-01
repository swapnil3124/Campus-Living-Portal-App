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
    studentPassword?: string;
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
    studentPassword: { type: String }
}, { strict: false });

const Admission = mongoose.models.Admission || mongoose.model<IAdmission>('Admission', AdmissionSchema);
export default Admission;
