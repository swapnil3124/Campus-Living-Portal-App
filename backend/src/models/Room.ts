import mongoose, { Schema, Document } from 'mongoose';

export interface IBed {
    bedNumber: number;
    isBooked: boolean;
    studentName?: string;
    studentBranch?: string;
    studentId?: string;
}

export interface IRoom extends Document {
    hostelName: string;
    roomNumber: string;
    floor: number;
    beds: IBed[];
}

const BedSchema: Schema = new Schema({
    bedNumber: { type: Number, required: true },
    isBooked: { type: Boolean, default: false },
    studentName: { type: String, default: null },
    studentBranch: { type: String, default: null },
    studentId: { type: String, default: null },
});

const RoomSchema: Schema = new Schema({
    hostelName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    floor: { type: Number, required: true },
    beds: { type: [BedSchema], required: true },
});

RoomSchema.index({ hostelName: 1, roomNumber: 1 }, { unique: true });

export default mongoose.model<IRoom>('Room', RoomSchema);
