import { Request, Response } from 'express';
import Admission from '../models/Admission';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_staff_key_2025';

export const studentLogin = async (req: Request, res: Response) => {
    try {
        const { enrollmentId, password } = req.body;

        if (!enrollmentId || !password) {
            return res.status(400).json({ message: 'Enrollment ID and Password are required' });
        }

        const student = await Admission.findOne({ enrollment: enrollmentId });

        if (!student || student.studentPassword !== password) {
            return res.status(401).json({ message: 'Invalid Enrollment ID or Password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: student._id, enrollment: student.enrollment, role: 'student' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            student: {
                id: student._id,
                name: student.fullName,
                enrollmentId: student.enrollment,
                email: student.email,
                department: student.department,
                gender: student.gender,
                isRoomAllocated: student.isRoomAllocated,
                allocatedRoom: student.allocatedRoom,
                allocatedBed: student.allocatedBed,
                status: student.status
            }
        });
    } catch (error: any) {
        console.error('Student login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getStudentProfile = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized, token missing' });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Unauthorized, invalid token' });
        }

        if (decoded.role !== 'student') {
            return res.status(403).json({ message: 'Forbidden: Students only' });
        }

        const student = await Admission.findById(decoded.id).select('-studentPassword');
        if (!student) {
            return res.status(404).json({ message: 'Student not found in admission records' });
        }

        res.json({ success: true, student });
    } catch (error: any) {
        console.error('Fetch student profile error:', error);
        res.status(500).json({ message: 'Internal server error while fetching profile' });
    }
};

export const updateStudentProfile = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized, token missing' });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Unauthorized, invalid token' });
        }

        if (decoded.role !== 'student') {
            return res.status(403).json({ message: 'Forbidden: Students only' });
        }

        const student = await Admission.findById(decoded.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found in admission records' });
        }

        // Only allow updating specific fields
        const { phone, email, parentName, parentRelation, parentContact, parentAddress } = req.body;

        if (phone) student.phone = phone;
        if (email) student.email = email;
        
        // Ensure additionalData exists before assigning
        if (!student.additionalData) {
            student.additionalData = {};
        }
        
        // Explicitly update only allowed nested emergency fields
        if (parentName) student.additionalData.parentName = parentName;
        if (parentRelation) student.additionalData.parentRelation = parentRelation;
        if (parentContact) student.additionalData.parentContact = parentContact;
        if (parentAddress) student.additionalData.parentAddress = parentAddress;

        // Save after modifying sub-document mixed type
        student.markModified('additionalData');
        await student.save();

        res.json({ success: true, message: 'Profile updated successfully', student });
    } catch (error: any) {
        console.error('Update student profile error:', error);
        res.status(500).json({ message: 'Internal server error while updating profile' });
    }
};
