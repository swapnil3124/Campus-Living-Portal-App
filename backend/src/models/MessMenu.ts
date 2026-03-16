import mongoose, { Schema, Document } from 'mongoose';

export interface IMessMenu extends Document {
    hostelType: 'boys' | 'girls';
    menuFileUrl?: string; // photo or circular
    fees: string;
    paymentQrUrl?: string;
    lastUpdatedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const MessMenuSchema: Schema = new Schema({
    hostelType: { type: String, required: true, enum: ['boys', 'girls'], unique: true },
    menuFileUrl: { type: String },
    fees: { type: String, required: true },
    paymentQrUrl: { type: String },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'Staff' }
}, { timestamps: true });

export default mongoose.model<IMessMenu>('MessMenu', MessMenuSchema);
