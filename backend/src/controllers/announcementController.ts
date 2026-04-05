import { Request, Response } from 'express';
import { Announcement } from '../models/Announcement';
import MeritList from '../models/MeritList';
import { getIO } from '../socket';

export const getAnnouncements = async (req: Request, res: Response) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcements', error });
    }
};

export const getActiveAnnouncements = async (req: Request, res: Response) => {
    try {
        const currentDate = new Date();
        const announcements = await Announcement.find({
            isActive: true,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        }).sort({ createdAt: -1 });

        if (announcements.length === 0) {
            return res.status(200).json([{
                _id: 'default',
                message: "Welcome to GP Awasari Campus Portal",
                details: "Welcome to Government Polytechnic Awasari Campus Living Portal. Stay tuned for further updates."
            }]);
        }

        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcements', error });
    }
};

export const createAnnouncement = async (req: Request, res: Response) => {
    try {
        const { message, details, startDate, endDate, isActive, createdBy } = req.body;
        const announcement = new Announcement({
            message,
            details,
            startDate,
            endDate,
            isActive: isActive !== undefined ? isActive : true,
            createdBy
        });
        await announcement.save();
        getIO().emit('announcements_updated');
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Error creating announcement', error });
    }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByIdAndUpdate(id, req.body, { returnDocument: 'after' });
        getIO().emit('announcements_updated');
        res.status(200).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Error updating announcement', error });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findById(id);

        if (announcement) {
            await Announcement.findByIdAndDelete(id);

            // Revert published merit lists if this was a merit list announcement
            if (announcement.message?.startsWith('Merit List Published:')) {
                await MeritList.updateMany(
                    { status: 'published' },
                    { $set: { status: 'sent_to_rector' } }
                );
            }
        }

        getIO().emit('announcements_updated');
        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting announcement', error });
    }
};
