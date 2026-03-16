import { Request, Response } from 'express';
import LeaveRecord from '../models/LeaveRecord';
import Leave from '../models/Leave';
import Admission from '../models/Admission';
import Staff from '../models/Staff';
import mongoose from 'mongoose';

export const scanOutgoing = async (req: Request, res: Response): Promise<any> => {
    try {
        console.log('Outgoing scan request body:', req.body);
        const { qrCodeToken, watchmanId } = req.body;

        if (!qrCodeToken || !watchmanId) {
            console.log('Missing fields in outgoing scan:', { qrCodeToken, watchmanId });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const watchman = await Staff.findById(watchmanId);
        if (!watchman || watchman.role !== 'watchman') {
            return res.status(403).json({ error: 'Unauthorized. Only watchmen can scan leaves.' });
        }

        const leave = await Leave.findOne({ qrCodeToken, status: 'approved' });
        if (!leave) {
            return res.status(404).json({ error: 'Valid approved leave not found' });
        }

        const student = await Admission.findById(leave.studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Check hostel access
        const studentGender = student.gender?.toLowerCase();
        const watchmanScope = watchman.subRole?.toLowerCase(); // 'boys' or 'girls'

        if (watchmanScope === 'boys' && studentGender !== 'male') {
            return res.status(403).json({ error: 'Boys hostel watchman can only scan boys entries.' });
        }
        if (watchmanScope === 'girls' && studentGender !== 'female') {
            return res.status(403).json({ error: 'Girls hostel watchman can only scan girls entries.' });
        }

        // Check if already away
        const existingRecord = await LeaveRecord.findOne({ leaveId: leave._id, status: 'away' });
        if (existingRecord) {
            return res.status(400).json({ error: 'Student already marked as away for this leave.' });
        }

        const newRecord = new LeaveRecord({
            studentId: student._id,
            studentName: student.fullName,
            studentEnrollment: student.enrollment,
            hostelName: student.allocatedHostel || 'N/A',
            roomNo: student.allocatedRoom || 'N/A',
            branch: student.department || 'N/A',
            leaveType: leave.leaveType,
            reason: leave.reason,
            destination: leave.destination,
            outgoingTime: new Date(),
            status: 'away',
            watchmanId: watchman._id,
            leaveId: leave._id
        });

        await newRecord.save();
        res.status(201).json({ success: true, record: newRecord });
    } catch (error: any) {
        console.error('Outgoing scan error:', error);
        res.status(500).json({ error: 'Server error during outgoing scan' });
    }
};

export const scanIncoming = async (req: Request, res: Response): Promise<any> => {
    try {
        const { qrCodeToken, watchmanId } = req.body;

        if (!qrCodeToken || !watchmanId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const watchman = await Staff.findById(watchmanId);
        if (!watchman || watchman.role !== 'watchman') {
            return res.status(403).json({ error: 'Unauthorized. Only watchmen can scan leaves.' });
        }

        const leave = await Leave.findOne({ qrCodeToken });
        if (!leave) {
            return res.status(404).json({ error: 'Leave not found' });
        }

        const record = await LeaveRecord.findOne({ leaveId: leave._id, status: 'away' });
        if (!record) {
            return res.status(404).json({ error: 'No active outgoing entry found for this student.' });
        }

        record.incomingTime = new Date();
        record.status = 'returned';
        await record.save();

        // Expire the QR token so it can't be used again
        await Leave.findByIdAndUpdate(leave._id, { qrCodeToken: null });

        res.status(200).json({ success: true, record });
    } catch (error: any) {
        console.error('Incoming scan error:', error);
        res.status(500).json({ error: 'Server error during incoming scan' });
    }
};

export const getLeaveLogs = async (req: Request, res: Response): Promise<any> => {
    try {
        const { watchmanId } = req.query;
        if (!watchmanId) {
            return res.status(400).json({ error: 'Watchman ID is required' });
        }

        const watchman = await Staff.findById(watchmanId);
        if (!watchman || watchman.role !== 'watchman') {
            return res.status(403).json({ error: 'Unauthorized.' });
        }

        const watchmanScope = watchman.subRole?.toLowerCase();
        let query: any = {};

        // In the logs, we might want to filter by scope too. 
        // Although LeaveRecord already has student info.
        
        const logs = await LeaveRecord.find(query).sort({ createdAt: -1 }).limit(100);
        
        // Filter logs based on watchman scope
        const filteredLogs = logs.filter(log => {
            const gel = log.hostelName?.toLowerCase();
            const isBoysHostel = ['shivneri', 'lenyadri', 'bhimashankar'].some(h => gel.includes(h));
            const isGirlsHostel = ['saraswati', 'shwetambar', 'shwetambara', 'jijau'].some(h => gel.includes(h));
            
            if (watchmanScope === 'boys') return isBoysHostel;
            if (watchmanScope === 'girls') return isGirlsHostel;
            return true;
        });

        res.status(200).json(filteredLogs);
    } catch (error: any) {
        console.error('Fetch logs error:', error);
        res.status(500).json({ error: 'Server error while fetching logs' });
    }
};
