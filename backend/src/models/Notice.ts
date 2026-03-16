import mongoose, { Schema, Document } from 'mongoose';

export enum NoticePriority {
    NORMAL = 'normal',
    IMPORTANT = 'important',
    URGENT = 'urgent'
}

export interface INotice extends Document {
    title: string;
    description: string;
    hostelName: string; // To filter by hostel
    priority: NoticePriority;
    category: string;
    issuedBy: string; // Name of the warden/staff
    isPublic: boolean; // Publish to Home page
    publishToStudents: boolean; // Publish to Students of this hostel
    isActive: boolean;
    fileUrl?: string; // Optional circular attachment
    fileName?: string; // Original name of the file
    expiryDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const NoticeSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    hostelName: { type: String, required: true }, // e.g., 'Shivneri Hostel'
    priority: { 
        type: String, 
        enum: Object.values(NoticePriority), 
        default: NoticePriority.NORMAL 
    },
    category: { type: String, default: 'General' },
    issuedBy: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    publishToStudents: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    fileUrl: { type: String },
    fileName: { type: String },
    expiryDate: { type: Date },
}, { timestamps: true });

// Index for faster queries by hostel
NoticeSchema.index({ hostelName: 1, isActive: 1 });

export default mongoose.model<INotice>('Notice', NoticeSchema);
