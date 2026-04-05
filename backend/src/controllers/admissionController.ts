import { Request, Response } from 'express';
import Admission from '../models/Admission';
import { getIO } from '../socket';

export const getAllAdmissions = async (req: Request, res: Response) => {
    try {
        const { role, subRole } = (req as any).user;
        const { year } = req.query;
        let query: any = {};

        if (year) {
            query.year = year;
        }

        // Apply filtering logic based on role and subRole (hostel)
        if (role === 'warden' || (role === 'admin' && subRole)) {
            const hNameRaw = subRole.toLowerCase();
            if (hNameRaw === 'shivneri') {
                // Shivneri Warden manages 1st Year Male students
                query.year = '1st';
                query.gender = { $regex: /^male$/i };
            } else if (hNameRaw === 'lenyadri') {
                // Lenyadri Warden manages 2nd Year Male students
                query.year = '2nd';
                query.gender = { $regex: /^male$/i };
            } else if (hNameRaw === 'bhimashankar') {
                // Bhimashankar Warden manages 3rd Year Male students
                query.year = '3rd';
                query.gender = { $regex: /^male$/i };
            } else if (hNameRaw === 'saraswati') {
                // Saraswati Warden manages 1st Year Female students
                query.year = '1st';
                query.gender = { $regex: /^female$/i };
            } else if (['shwetamber', 'shwetambara'].includes(hNameRaw)) {
                // Shwetambara Warden manages 2nd and 3rd Year Female students
                query.year = { $in: ['2nd', '3rd'] };
                query.gender = { $regex: /^female$/i };
            }
        } else if (role === 'rector') {
            const hNameRaw = subRole?.toLowerCase();
            if (hNameRaw === 'boys') {
                query.gender = { $regex: /^male$/i };
            } else if (hNameRaw === 'girls') {
                query.gender = { $regex: /^female$/i };
            }
        }

        // Exclude heavy fields like additionalData which might contain multiple large base64 strings
        const admissions = await Admission.find(query)
            .select('-additionalData')
            .sort({ appliedAt: -1 });
        res.json(admissions);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const getAdmissionById = async (req: Request, res: Response) => {
    try {
        const admission = await Admission.findById(req.params.id);
        if (!admission) return res.status(404).json({ message: 'Admission not found' });
        res.json(admission);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const createAdmission = async (req: Request, res: Response) => {
    try {
        console.log('Received Admission Data:', JSON.stringify(req.body).substring(0, 200) + '...');
        const newAdmission = new Admission(req.body);
        const savedAdmission = await newAdmission.save();
        getIO().emit('admissions_updated');
        res.status(201).json(savedAdmission);
    } catch (err: any) {
        console.error('Admission Creation Error:', err.message);
        if (err.name === 'ValidationError') {
            console.error('Validation Errors:', JSON.stringify(err.errors, null, 2));
            return res.status(400).json({ message: 'Validation Error', errors: err.errors });
        }
        res.status(400).json({ message: err.message });
    }
};

export const updateAdmission = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { role, subRole } = (req as any).user;
        const admission = await Admission.findById(req.params.id);

        if (!admission) return res.status(404).json({ message: 'Admission not found' });

        // Security Check: Wardens can only update their own students
        if (role === 'warden' || (role === 'admin' && subRole)) {
            const hNameRaw = subRole.toLowerCase();
            let isAuthorized = false;

            if (hNameRaw === 'shivneri') {
                isAuthorized = admission.year === '1st' && admission.gender?.toLowerCase() === 'male';
            } else if (hNameRaw === 'lenyadri') {
                isAuthorized = admission.year === '2nd' && admission.gender?.toLowerCase() === 'male';
            } else if (hNameRaw === 'bhimashankar') {
                isAuthorized = admission.year === '3rd' && admission.gender?.toLowerCase() === 'male';
            } else if (hNameRaw === 'saraswati') {
                isAuthorized = admission.year === '1st' && admission.gender?.toLowerCase() === 'female';
            } else if (['shwetamber', 'shwetambara'].includes(hNameRaw)) {
                isAuthorized = ['2nd', '3rd'].includes(admission.year) && admission.gender?.toLowerCase() === 'female';
            }

            if (!isAuthorized && role !== 'rector') {
                return res.status(403).json({ message: 'Access Denied: You cannot update students outside your hostel scope.' });
            }
        }

        const updatedAdmission = await Admission.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after' }
        );
        getIO().emit('admissions_updated');
        res.json(updatedAdmission);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

export const deleteAdmission = async (req: Request, res: Response) => {
    try {
        await Admission.findByIdAndDelete(req.params.id);
        getIO().emit('admissions_updated');
        res.json({ message: 'Admission deleted' });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
