import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Complaint from '../models/Complaint';
import Admission from '../models/Admission';

export const createComplaint = async (req: Request, res: Response): Promise<any> => {
    try {
        console.log('--- Create Complaint Request ---');
        console.log('Body:', req.body);
        console.log('File:', req.file);

        const { studentId, type, priority, description } = req.body;

        if (!studentId || !type || !description) {
            return res.status(400).json({ error: 'Missing required fields: studentId, type, or description' });
        }

        if (!mongoose.Types.ObjectId.isValid(studentId as string)) {
            return res.status(400).json({ error: 'Invalid Student ID format' });
        }

        // Fetch student details to get hostel and room info automatically
        const student = await Admission.findById(studentId);
        if (!student) {
            console.log('Student not found for ID:', studentId);
            return res.status(404).json({ error: 'Student not found. Please check your account details.' });
        }

        console.log('Found Student:', {
            fullName: student.fullName,
            enrollment: student.enrollment,
            hostel: student.allocatedHostel,
            room: student.allocatedRoom,
            isAllocated: student.isRoomAllocated
        });

        const studentHostel = student.allocatedHostel || (student as any).hostelName || 'General';
        const studentRoom = student.allocatedRoom || (student as any).roomNo || 'Unknown';

        const newComplaint = new Complaint({
            studentId,
            studentName: student.fullName || 'Anonymous',
            studentEnrollment: student.enrollment || 'N/A',
            hostelName: studentHostel,
            roomNumber: studentRoom,
            type,
            priority: (priority || 'medium').toLowerCase(),
            description: description.trim(),
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
        });

        await newComplaint.save();
        console.log('Complaint saved successfully:', newComplaint._id);

        res.status(201).json({ success: true, complaint: newComplaint });
    } catch (error: any) {
        console.error('ERROR CREATING COMPLAINT:', error);
        res.status(500).json({ 
            error: 'Server error while creating complaint', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        });
    }
};

export const getStudentComplaints = async (req: Request, res: Response): Promise<any> => {
    try {
        const { studentId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(studentId as string)) {
            console.log(`Invalid Student ID: ${studentId}, returning empty list`);
            return res.status(200).json([]);
        }

        const complaints = await Complaint.find({ studentId }).sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        console.error('Error fetching student complaints:', error);
        res.status(500).json({ error: 'Server error while fetching complaints' });
    }
};

export const getWardenComplaints = async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        let { hostelName } = req.query;

        let query: any = {};
        let role = user?.role;
        let subRole = user?.subRole;

        if (role === 'admin' && subRole) {
            const hName = subRole.toLowerCase();
            if (['shivneri', 'lenyadri', 'bhimashankar', 'saraswati', 'shwetambar', 'shwetambara'].includes(hName)) {
                query.hostelName = new RegExp(hName, 'i');
            }
        } else if (role === 'rector' && subRole) {
            const hName = subRole.toLowerCase();
            if (hName === 'girls') {
                // Saraswati and Shwetambar are the two girls hostels, plus catch generic 'girls'
                query.hostelName = { $regex: /saraswati|shwetambar|shwetambara|girls/i };
            } else if (hName === 'boys') {
                query.hostelName = { $regex: /shivneri|lenyadri|bhimashankar|boys/i };
            }
        } else {
            if (!hostelName) {
                return res.status(400).json({ error: 'Hostel name is required' });
            }
            query.hostelName = new RegExp(hostelName as string, 'i');
        }

        const complaints = await Complaint.find(query).sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        console.error('Error fetching warden complaints:', error);
        res.status(500).json({ error: 'Server error while fetching complaints' });
    }
};

export const updateComplaintStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { complaintId } = req.params;
        const { status, wardenRemark, wardenId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(complaintId as string)) {
            return res.status(400).json({ error: 'Invalid complaint ID' });
        }

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            complaintId,
            { status, wardenRemark, wardenId, updatedAt: new Date() },
            { returnDocument: 'after' }
        );

        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        res.status(200).json({ success: true, complaint });
    } catch (error) {
        console.error('Error updating complaint status:', error);
        res.status(500).json({ error: 'Server error while updating complaint' });
    }
};
