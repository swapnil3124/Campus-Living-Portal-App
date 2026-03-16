import mongoose, { Schema, Document } from 'mongoose';

export interface IMessFeedback extends Document {
    studentId: mongoose.Types.ObjectId;
    studentName: string;
    mealType: 'breakfast' | 'lunch' | 'dinner';
    rating: number; // 1 to 5
    comment?: string;
    date: Date;
    hostelType: 'boys' | 'girls';
}

const MessFeedbackSchema: Schema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Admission', required: true },
    studentName: { type: String, required: true },
    mealType: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner'] },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    date: { type: Date, default: Date.now },
    hostelType: { type: String, required: true, enum: ['boys', 'girls'] }
}, { timestamps: true });

export default mongoose.model<IMessFeedback>('MessFeedback', MessFeedbackSchema);
