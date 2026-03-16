import { Request, Response } from 'express';
import MessMenu from '../models/MessMenu';
import MessFeedback from '../models/MessFeedback';
import Admission from '../models/Admission';

// Use environment variable for base URL if available, else fallback
const getFileUrl = (req: Request, filename: string) => {
    return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

export const getMessMenu = async (req: Request, res: Response): Promise<any> => {
    try {
        const { hostelType } = req.query;
        if (!hostelType) return res.status(400).json({ error: 'Hostel type is required' });

        const menu = await MessMenu.findOne({ hostelType: (hostelType as string).toLowerCase() });
        res.json(menu);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateMessMenu = async (req: Request, res: Response): Promise<any> => {
    try {
        const { hostelType, fees, contractorId } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!hostelType || !contractorId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const updateData: any = { 
            fees: fees || '0', 
            lastUpdatedBy: contractorId 
        };

        if (files) {
            if (files['menuFile'] && files['menuFile'][0]) {
                updateData.menuFileUrl = getFileUrl(req, files['menuFile'][0].filename);
            }
            if (files['paymentQr'] && files['paymentQr'][0]) {
                updateData.paymentQrUrl = getFileUrl(req, files['paymentQr'][0].filename);
            }
        }

        const menu = await MessMenu.findOneAndUpdate(
            { hostelType: hostelType.toLowerCase() },
            updateData,
            { upsert: true, new: true }
        );

        res.json({ success: true, menu });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const submitFeedback = async (req: Request, res: Response): Promise<any> => {
    try {
        const { studentId, rating, comment, mealType, hostelType } = req.body;

        if (!studentId || !rating || !mealType || !hostelType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const student = await Admission.findById(studentId);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const feedback = new MessFeedback({
            studentId,
            studentName: student.fullName,
            rating,
            comment,
            mealType,
            hostelType: hostelType.toLowerCase()
        });

        await feedback.save();
        res.json({ success: true, feedback });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMessStats = async (req: Request, res: Response): Promise<any> => {
    try {
        const { hostelType } = req.query;
        if (!hostelType) return res.status(400).json({ error: 'Hostel type is required' });

        const hType = (hostelType as string).toLowerCase();

        // Calculate aggregate ratings for each meal type
        const aggregateRatings = await MessFeedback.aggregate([
            { $match: { hostelType: hType } },
            { 
                $group: { 
                    _id: '$mealType', 
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                } 
            }
        ]);

        const stats = {
            breakfast: { avg: 0, count: 0 },
            lunch: { avg: 0, count: 0 },
            dinner: { avg: 0, count: 0 }
        };

        aggregateRatings.forEach(r => {
            if (r._id === 'breakfast') stats.breakfast = { avg: Math.round(r.avgRating * 10) / 10, count: r.count };
            if (r._id === 'lunch') stats.lunch = { avg: Math.round(r.avgRating * 10) / 10, count: r.count };
            if (r._id === 'dinner') stats.dinner = { avg: Math.round(r.avgRating * 10) / 10, count: r.count };
        });

        const recentFeedback = await MessFeedback.find({ hostelType: hType })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            stats,
            feedback: recentFeedback
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
