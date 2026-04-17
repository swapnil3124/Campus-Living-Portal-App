import { Request, Response } from 'express';
import Notice from '../models/Notice';

export const createNotice = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, description, hostelName, priority, category, issuedBy, expiryDate, isPublic, publishToStudents } = req.body;
        const file = req.file;

        if (!title || !description || !hostelName || !issuedBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newNotice = new Notice({
            title,
            description,
            hostelName,
            priority: priority || 'normal',
            category: category || 'General',
            issuedBy,
            isPublic: isPublic === 'true' || isPublic === true,
            publishToStudents: publishToStudents === 'true' || publishToStudents === true,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            fileUrl: file ? `/uploads/${file.filename}` : undefined,
            fileName: file ? file.originalname : undefined,
        });

        await newNotice.save();
        res.status(201).json({ success: true, notice: newNotice });
    } catch (error) {
        console.error('Error creating notice:', error);
        res.status(500).json({ error: 'Server error while creating notice' });
    }
};

export const getPublicNotices = async (req: Request, res: Response): Promise<any> => {
    try {
        const notices = await Notice.find({ 
            isPublic: true,
            isActive: true 
        }).sort({ createdAt: -1 });

        res.status(200).json(notices);
    } catch (error) {
        console.error('Error fetching public notices:', error);
        res.status(500).json({ error: 'Server error while fetching notices' });
    }
};

export const getHostelNotices = async (req: Request, res: Response): Promise<any> => {
    try {
        const { hostelName, studentOnly } = req.query;
        
        if (!hostelName) {
            return res.status(400).json({ error: 'Hostel name is required' });
        }

        const hName = (hostelName as string).toLowerCase().trim();

        const query: any = { isActive: true };

        // Support rector-level compound queries or individual hostel queries with regex for flexibility
        if (hName === 'girls' || hName.includes('saraswati') || hName.includes('shwetambar')) {
            query.hostelName = { $regex: /saraswati|shwetambar|girls/i };
        } else if (hName === 'boys' || hName.includes('shivneri') || hName.includes('lenyadri') || hName.includes('bhimashankar')) {
            query.hostelName = { $regex: /shivneri|lenyadri|bhimashankar|boys/i };
        } else {
            // Fallback for other potential hostels — case-insensitive match
            query.hostelName = new RegExp(`.*${hostelName as string}.*`, 'i');
        }

        if (studentOnly === 'true' || (studentOnly as any) === true) {
            query.publishToStudents = true;
        }

        // Fetch active notices for the specific hostel, sorted by newest first
        const notices = await Notice.find(query).sort({ createdAt: -1 });

        res.status(200).json(notices);
    } catch (error) {
        console.error('Error fetching hostel notices:', error);
        res.status(500).json({ error: 'Server error while fetching notices' });
    }
};

export const updateNotice = async (req: Request, res: Response): Promise<any> => {
    try {
        const { noticeId } = req.params;
        const updates = req.body;

        const updatedNotice = await Notice.findByIdAndUpdate(noticeId, updates, { returnDocument: 'after' });
        
        if (!updatedNotice) {
            return res.status(404).json({ error: 'Notice not found' });
        }

        res.status(200).json({ success: true, notice: updatedNotice });
    } catch (error) {
        console.error('Error updating notice:', error);
        res.status(500).json({ error: 'Server error while updating notice' });
    }
};

export const deleteNotice = async (req: Request, res: Response): Promise<any> => {
    try {
        const { noticeId } = req.params;
        const deletedNotice = await Notice.findByIdAndDelete(noticeId);

        if (!deletedNotice) {
            return res.status(404).json({ error: 'Notice not found' });
        }

        res.status(200).json({ success: true, message: 'Notice deleted' });
    } catch (error) {
        console.error('Error deleting notice:', error);
        res.status(500).json({ error: 'Server error while deleting notice' });
    }
};
