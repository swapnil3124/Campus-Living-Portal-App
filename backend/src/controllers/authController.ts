import { Request, Response } from 'express';
import Staff from '../models/Staff';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_staff_key_2025';

// Initialize Rector accounts if they don't exist
export const initializeStaff = async () => {
    try {
        const staffMembers = [
            {
                staffId: 'RCTR1051GPABOYS',
                password: 'RCB@1051',
                role: 'rector' as const,
                subRole: 'boys' as const,
                name: 'Boys Hostel Rector'
            },
            {
                staffId: 'RCTR1051GPAGIRLS',
                password: 'RCG@1051',
                role: 'rector' as const,
                subRole: 'girls' as const,
                name: 'Girls Hostel Rector'
            },
            // Warden Accounts - Verified Credentials
            {
                staffId: 'WRDSHIV1051',
                password: 'Shiv@WRD1051',
                role: 'admin' as const,
                subRole: 'shivneri' as const,
                name: 'Shivneri Hostel Warden'
            },
            {
                staffId: 'WRDLEND1051',
                password: 'Lend@WRD1051',
                role: 'admin' as const,
                subRole: 'lenyadri' as const,
                name: 'Lenyadri Hostel Warden'
            },
            {
                staffId: 'WRDBHIM1051',
                password: 'Bhim@WRD1051',
                role: 'admin' as const,
                subRole: 'bhimashankar' as const,
                name: 'Bhimashankar Hostel Warden'
            },
            {
                staffId: 'WRDSHWE1051',
                password: 'Shwe@WRD1051',
                role: 'admin' as const,
                subRole: 'shwetambara' as const,
                name: 'Shwetambara Hostel Warden'
            },
            {
                staffId: 'WRDSARA1051',
                password: 'Sara@WRD1051',
                role: 'admin' as const,
                subRole: 'saraswati' as const,
                name: 'Saraswati Hostel Warden'
            }
        ];

        for (const data of staffMembers) {
            const existing = await Staff.findOne({ staffId: data.staffId });
            if (!existing) {
                const newStaff = new Staff(data);
                await newStaff.save();
                console.log(`Initialized account for: ${data.staffId}`);
            } else {
                // Enforce the requested credentials and metadata
                existing.password = data.password;
                existing.role = data.role as any;
                existing.subRole = data.subRole;
                existing.name = data.name;
                await existing.save();
            }
        }
    } catch (error: any) {
        console.error('Staff initialization error:', error.message);
    }
};

export const staffLogin = async (req: Request, res: Response) => {
    try {
        const { staffId, password } = req.body;

        const staff = await Staff.findOne({ staffId: { $regex: new RegExp(`^${staffId}$`, 'i') } });
        if (!staff) {
            return res.status(401).json({ message: 'Invalid ID or Password' });
        }

        const isMatch = await staff.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid ID or Password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: staff._id, staffId: staff.staffId, role: staff.role, subRole: staff.subRole },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: staff._id,
                staffId: staff.staffId,
                role: staff.role,
                subRole: staff.subRole,
                name: staff.name
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
