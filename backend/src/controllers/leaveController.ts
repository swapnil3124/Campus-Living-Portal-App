import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Leave, { LeaveStatus } from '../models/Leave';
import Admission from '../models/Admission';
import crypto from 'crypto';

export const createLeave = async (req: Request, res: Response): Promise<any> => {
    try {
        const { studentId, leaveType, fromDate, toDate, reason, destination, parentContact } = req.body;

        if (!studentId || !leaveType || !fromDate || !toDate || !reason || !destination || !parentContact) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!mongoose.Types.ObjectId.isValid(studentId as string)) {
            return res.status(400).json({ error: 'Invalid Student ID format' });
        }

        const student = await Admission.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const studentHostel = student.allocatedHostel || (student as any).hostelName || 'Unknown';
        const studentRoom = student.allocatedRoom || (student as any).roomNo || 'Unknown';
        const studentYear = student.year || 'Unknown';

        const fromDateParsed = new Date(fromDate);
        const toDateParsed = new Date(toDate);

        if (isNaN(fromDateParsed.getTime()) || isNaN(toDateParsed.getTime())) {
            return res.status(400).json({ error: 'Invalid date format for fromDate or toDate' });
        }

        const newLeave = new Leave({
            studentId,
            studentName: student.fullName || 'Anonymous',
            studentEnrollment: student.enrollment || 'N/A',
            studentYear,
            hostelName: studentHostel,
            roomNo: studentRoom,
            leaveType,
            fromDate: fromDateParsed,
            toDate: toDateParsed,
            reason,
            destination,
            parentContact,
            status: LeaveStatus.PENDING
        });

        await newLeave.save();
        console.log('Leave created:', newLeave._id, 'for student:', student.fullName);

        res.status(201).json({ success: true, leave: newLeave });
    } catch (error: any) {
        console.error('Error creating leave:', error);
        res.status(500).json({ error: 'Server error while creating leave application' });
    }
};

export const getStudentLeaves = async (req: Request, res: Response): Promise<any> => {
    try {
        const { studentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(studentId as string)) {
            return res.status(400).json({ error: 'Invalid Student ID format' });
        }

        const leaves = await Leave.find({ studentId }).sort({ createdAt: -1 });

        // Calculate total approved leaves to show as count
        const approvedCount = await Leave.countDocuments({ studentId, status: LeaveStatus.APPROVED });

        const leavesWithCount = leaves.map(l => ({
            ...l.toObject(),
            id: l._id,
            leaveCount: approvedCount
        }));

        res.status(200).json(leavesWithCount);
    } catch (error: any) {
        console.error('Error fetching student leaves:', error);
        res.status(500).json({ error: 'Server error while fetching leaves' });
    }
};

export const getWardenLeaves = async (req: Request, res: Response): Promise<any> => {
    try {
        const user = (req as any).user;
        let { hostelName } = req.query;

        let query: any = {};
        let role = user?.role;
        let subRole = user?.subRole;

        if (role === 'admin' && subRole) {
            const hName = subRole.toLowerCase();
            if (hName === 'shivneri') {
                query.hostelName = { $regex: /^shivneri$/i };
            } else if (hName === 'lenyadri') {
                query.hostelName = { $regex: /^lenyadri$/i };
            } else if (hName === 'bhimashankar') {
                query.hostelName = { $regex: /^bhimashankar$/i };
            } else if (hName === 'saraswati') {
                query.hostelName = { $regex: /^saraswati$/i };
            } else if (['shwetambar', 'shwetambara'].includes(hName)) {
                // Both spelling variants map to the Shwetambar girls hostel
                query.hostelName = { $regex: /^shwetambar(a)?$/i };
            }
        } else if (role === 'rector' && subRole) {
            const hName = subRole.toLowerCase();
            if (hName === 'girls') {
                // Girls rector sees leaves from Saraswati AND Shwetambar, plus generic 'girls'
                query.hostelName = { $regex: /saraswati|shwetambara|shwetambar|girls/i };
            } else if (hName === 'boys') {
                query.hostelName = { $regex: /shivneri|lenyadri|bhimashankar|boys/i };
            }
        } else {
            // Fallback to query parameter
            if (!hostelName) {
                return res.status(400).json({ error: 'Hostel name is required' });
            }
            const hName = (hostelName as string).toLowerCase();
            if (hName === 'shivneri') {
                query.hostelName = { $regex: /^shivneri$/i };
            } else if (hName === 'lenyadri') {
                query.hostelName = { $regex: /^lenyadri$/i };
            } else if (hName === 'bhimashankar') {
                query.hostelName = { $regex: /^bhimashankar$/i };
            } else if (hName === 'saraswati') {
                query.hostelName = { $regex: /^saraswati$/i };
            } else if (['shwetambar', 'shwetambara'].includes(hName)) {
                query.hostelName = { $regex: /^shwetambar(a)?$/i };
            } else if (hName === 'girls') {
                query.hostelName = { $regex: /saraswati|shwetambar/i };
            } else if (hName === 'boys') {
                query.hostelName = { $regex: /shivneri|lenyadri|bhimashankar/i };
            } else {
                query.hostelName = new RegExp(`^${hName}$`, 'i');
            }
        }

        const leaves = await Leave.find(query).sort({ createdAt: -1 });

        // Fetch leave counts for each student in the list
        const leavesWithCount = await Promise.all(leaves.map(async (leave) => {
            const approvedCount = await Leave.countDocuments({ 
                studentId: leave.studentId, 
                status: LeaveStatus.APPROVED 
            });
            return {
                ...leave.toObject(),
                id: leave._id, // ensure ID is passed
                leaveCount: approvedCount
            };
        }));

        res.status(200).json(leavesWithCount);
    } catch (error: any) {
        console.error('Error fetching warden leaves:', error);
        res.status(500).json({ error: 'Server error while fetching leaves' });
    }
};

export const updateLeaveStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { leaveId } = req.params;
        const { status, rejectionReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(leaveId as string)) {
            return res.status(400).json({ error: 'Invalid Leave ID' });
        }

        if (!Object.values(LeaveStatus).includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        let updateData: any = { status, updatedAt: new Date() };

        if (status === LeaveStatus.REJECTED) {
            updateData.rejectionReason = rejectionReason || 'No reason provided';
            updateData.qrCodeToken = null;
        } else if (status === LeaveStatus.APPROVED) {
            // Generate QR token
            updateData.qrCodeToken = crypto.randomBytes(16).toString('hex');
            updateData.rejectionReason = ''; // clear reason
        }

        const leave = await Leave.findByIdAndUpdate(
            leaveId,
            updateData,
            { returnDocument: 'after' }
        );

        if (!leave) {
            return res.status(404).json({ error: 'Leave application not found' });
        }

        res.status(200).json({ success: true, leave });
    } catch (error: any) {
        console.error('Error updating leave status:', error);
        res.status(500).json({ error: 'Server error while updating leave status' });
    }
};
