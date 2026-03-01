import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
    message: { type: String, required: true },
    details: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export const Announcement = mongoose.model('Announcement', AnnouncementSchema);
