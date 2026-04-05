import { Request, Response } from 'express';
import HostelExit from '../models/HostelExit';
import { getIO } from '../socket';
import Admission from '../models/Admission';
import Room from '../models/Room';

export const submitExitRequest = async (req: Request, res: Response): Promise<any> => {
    try {
        const {
            studentId, studentName, enrollmentNo, hostelName, roomNo, bedNumber,
            exitDate, reason, exitAssets
        } = req.body;

        if (!studentId || !studentName || !hostelName || !roomNo || !exitDate || !reason || !exitAssets) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newExitRequest = new HostelExit({
            studentId, studentName, enrollmentNo, hostelName, roomNo, bedNumber,
            exitDate, reason, exitAssets
        });

        await newExitRequest.save();

        getIO().emit('hostel_exit_updated');

        res.status(201).json({ success: true, request: newExitRequest });
    } catch (error: any) {
        console.error('Submit exit request error:', error);
        res.status(500).json({ message: 'Server error while submitting exit request', error: error.message });
    }
};

export const getStudentExitRequests = async (req: Request, res: Response): Promise<any> => {
    try {
        const { studentId, userRole } = req.query as any;

        let query = {};
        if (userRole === 'student' && studentId) {
            query = { studentId };
        } 
        
        const requests = await HostelExit.find(query).sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error: any) {
        console.error('Fetch student exit requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getWardenExitRequests = async (req: Request, res: Response): Promise<any> => {
    try {
        const { hostelName } = req.query as { hostelName: string };
        const requests = await HostelExit.find({
            hostelName: { $regex: new RegExp(`^${hostelName}$`, 'i') }
        }).sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error: any) {
        console.error('Fetch warden exit requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateExitRequestStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status, wardenRemark } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updatedRequest = await HostelExit.findByIdAndUpdate(
            id,
            { status, wardenRemark },
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Vacating logic if approved
        if (status === 'approved') {
            try {
                // 1. Update Student (Admission document)
                await Admission.findByIdAndUpdate(
                    updatedRequest.studentId,
                    { 
                        $set: { 
                            isRoomAllocated: false,
                            allocatedHostel: null,
                            allocatedRoom: null,
                            allocatedBed: null,
                            status: 'past'  // Or just rely on isRoomAllocated
                        }
                    }
                );

                // 2. Free up the bed in Room document
                if (updatedRequest.roomNo && updatedRequest.hostelName) {
                    await Room.updateOne(
                        { 
                            roomNumber: updatedRequest.roomNo,
                            hostelName: { $regex: new RegExp(`^${updatedRequest.hostelName}$`, 'i') }
                        },
                        {
                            $set: {
                                "beds.$[bed].isBooked": false,
                                "beds.$[bed].studentName": null,
                                "beds.$[bed].studentBranch": null,
                                "beds.$[bed].studentId": null
                            }
                        },
                        {
                            arrayFilters: [{ "bed.studentId": updatedRequest.studentId }]
                        }
                    );
                }
            } catch (innerError) {
                console.error("Error vacating room upon approval:", innerError);
            }
        }

        getIO().emit('hostel_exit_updated');

        res.status(200).json({ success: true, request: updatedRequest });
    } catch (error: any) {
        console.error('Update exit request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
