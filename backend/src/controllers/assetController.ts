import { Request, Response } from 'express';
import RoomAsset from '../models/RoomAsset';

export const submitAssetDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomNumber, studentId, hostelName, items } = req.body;

        if (!roomNumber || !studentId || !hostelName || !items) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const report = await RoomAsset.findOneAndUpdate(
            { roomNumber, studentId, hostelName },
            { items, submittedAt: new Date() },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error('Error submitting asset details:', error);
        res.status(500).json({ error: 'Server error while submitting asset details' });
    }
};

export const getAssetDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomNumber, studentId, hostelName } = req.query;

        if (!roomNumber || !hostelName) {
            return res.status(400).json({ error: 'Room number and hostel name are required' });
        }

        let query: any = { roomNumber, hostelName };
        if (studentId) {
            query.studentId = studentId;
        }

        // If it's a warden (no studentId), get the most recent report for that room
        const report = await RoomAsset.findOne(query).sort({ submittedAt: -1 });
        
        res.status(200).json(report);
    } catch (error) {
        console.error('Error fetching asset details:', error);
        res.status(500).json({ error: 'Server error while fetching asset details' });
    }
};
