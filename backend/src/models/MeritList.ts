import mongoose, { Schema, Document } from 'mongoose';

export interface IMeritList extends Document {
    title: string;
    department: string;
    students: Array<{
        admissionId: mongoose.Types.ObjectId;
        fullName: string;
        enrollment: string;
        prevMarks: number;
        category: string;
        photoUrl?: string;
        rank: number;
        selectionCategory: string; // The category they were selected under
    }>;
    generatedAt: Date;
    settings: any;
    status: 'draft' | 'published';
}

const MeritListSchema: Schema = new Schema({
    title: { type: String, required: true },
    department: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    students: [{
        admissionId: { type: Schema.Types.ObjectId, ref: 'Admission' },
        fullName: String,
        enrollment: String,
        prevMarks: Number,
        category: String,
        photoUrl: String,
        rank: Number,
        selectionCategory: String
    }],
    generatedAt: { type: Date, default: Date.now },
    settings: { type: Schema.Types.Mixed }
});

const MeritList = mongoose.model<IMeritList>('MeritList', MeritListSchema);
export default MeritList;
