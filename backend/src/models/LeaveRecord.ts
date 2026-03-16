import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveRecord extends Document {
    studentId: mongoose.Types.ObjectId;
    studentName: string;
    studentEnrollment: string;
    hostelName: string;
    roomNo: string;
    branch: string;
    leaveType: string;
    reason: string;
    destination: string;
    outgoingTime: Date;
    incomingTime?: Date;
    status: 'away' | 'returned';
    watchmanId: mongoose.Types.ObjectId;
    leaveId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const LeaveRecordSchema: Schema = new Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Admission', required: true },
    studentName: { type: String, required: true },
    studentEnrollment: { type: String, required: true },
    hostelName: { type: String, required: true },
    roomNo: { type: String, required: true },
    branch: { type: String, required: true },
    leaveType: { type: String, required: true },
    reason: { type: String, required: true },
    destination: { type: String, required: true },
    outgoingTime: { type: Date, required: true },
    incomingTime: { type: Date },
    status: { type: String, enum: ['away', 'returned'], default: 'away' },
    watchmanId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    leaveId: { type: Schema.Types.ObjectId, ref: 'Leave', required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ILeaveRecord>('LeaveRecord', LeaveRecordSchema);
