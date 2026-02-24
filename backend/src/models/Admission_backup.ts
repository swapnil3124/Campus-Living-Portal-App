import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmission extends Document {
    fullName: string;
    enrollment: string;
    email: string;
    phone: string;
    dob: string;
    gender: string;
    category: string;
    instituteName: string;
    department: string;
    yearOfStudy: string;
    prevMarks: string;
    sscPercentage: string;
    hostelType: string;
    distance: string;
    permanentAddress: string;
    parentName: string;
    parentPhone: string;
    hasMedicalCondition: boolean;
    medicalDescription: string;
    status: 'pending' | 'verified' | 'accepted' | 'rejected';
    appliedAt: Date;
}

const AdmissionSchema: Schema = new Schema({
    fullName: { type: String, required: true },
    enrollment: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    category: { type: String, required: true },
    instituteName: { type: String, required: true },
    department: { type: String, required: true },
    yearOfStudy: { type: String, required: true },
    prevMarks: { type: String, required: true },
    sscPercentage: { type: String, required: true },
    hostelType: { type: String, required: true },
    distance: { type: String, required: true },
    permanentAddress: { type: String, required: true },
    parentName: { type: String, required: true },
    parentPhone: { type: String, required: true },
    hasMedicalCondition: { type: Boolean, default: false },
    medicalDescription: { type: String },
    status: { type: String, enum: ['pending', 'verified', 'accepted', 'rejected'], default: 'pending' },
    appliedAt: { type: Date, default: Date.now }
});

const Admission = mongoose.model<IAdmission>('Admission', AdmissionSchema);
export default Admission;
