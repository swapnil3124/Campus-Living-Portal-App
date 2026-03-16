import mongoose, { Schema, Document } from 'mongoose';

export interface IAssetItem {
    name: string;
    count: number;
    damagedCount: number;
    condition: 'WORKING' | 'DAMAGED';
}

export interface IRoomAsset extends Document {
    hostelName: string;
    roomNumber: string;
    studentId: string;
    items: IAssetItem[];
    submittedAt: Date;
}

const AssetItemSchema = new Schema({
    name: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
    damagedCount: { type: Number, required: true, default: 0 },
    condition: { type: String, enum: ['WORKING', 'DAMAGED'], default: 'WORKING' }
});

const RoomAssetSchema = new Schema({
    hostelName: { type: String, required: true },
    roomNumber: { type: String, required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Admission', required: true },
    items: [AssetItemSchema],
    submittedAt: { type: Date, default: Date.now }
});

// index by hostel and room. One official report per room? Or let's keep it per student for now but indexed by room too.
// Actually, it's better to have one report per room for the warden's view.
RoomAssetSchema.index({ hostelName: 1, roomNumber: 1, studentId: 1 }, { unique: true });

export default mongoose.model<IRoomAsset>('RoomAsset', RoomAssetSchema);
