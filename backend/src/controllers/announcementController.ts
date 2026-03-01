import { Request, Response } from 'express';
import { Announcement } from '../models/Announcement';

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
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Error creating announcement', error });
    }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Error updating announcement', error });
    }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Announcement.findByIdAndDelete(id);
        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting announcement', error });
    }
};
