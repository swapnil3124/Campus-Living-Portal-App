import { Request, Response } from 'express';
import Room from '../models/Room';
import Admission from '../models/Admission';

const getSeedData = (hostelName: string) => [
    ...Array.from({ length: 4 }, (_, i) => ({
        hostelName,
        roomNumber: `${101 + i}`,
        floor: 0,
        beds: [{ bedNumber: 1 }, { bedNumber: 2 }, { bedNumber: 3 }, { bedNumber: 4 }]
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
        hostelName,
        roomNumber: `${201 + i}`,
        floor: 1,
        beds: [{ bedNumber: 1 }, { bedNumber: 2 }, { bedNumber: 3 }, { bedNumber: 4 }]
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
        hostelName,
        roomNumber: `${301 + i}`,
        floor: 2,
        beds: [{ bedNumber: 1 }, { bedNumber: 2 }, { bedNumber: 3 }, { bedNumber: 4 }]
    })),
    ...Array.from({ length: 8 }, (_, i) => ({
        hostelName,
        roomNumber: `${401 + i}`,
        floor: 3,
        beds: [{ bedNumber: 1 }, { bedNumber: 2 }, { bedNumber: 3 }, { bedNumber: 4 }]
    }))
];

// Girls hostel: 3 floors × 12 rooms (101-112, 201-212, 301-312), 4 beds each
const getSeedDataGirls = (hostelName: string) => [
    // Ground floor: 101–112
    ...Array.from({ length: 12 }, (_, i) => ({
        hostelName,
        roomNumber: `${101 + i}`,
        floor: 0,
        beds: [{ bedNumber: 1 }, { bedNumber: 2 }, { bedNumber: 3 }, { bedNumber: 4 }]
    })),
    // 1st floor: 201–212
    ...Array.from({ length: 12 }, (_, i) => ({
        hostelName,
        roomNumber: `${201 + i}`,
        floor: 1,
        beds: [{ bedNumber: 1 }, { bedNumber: 2 }, { bedNumber: 3 }, { bedNumber: 4 }]
    })),
    // 2nd floor: 301–312
    ...Array.from({ length: 12 }, (_, i) => ({
        hostelName,
        roomNumber: `${301 + i}`,
        floor: 2,
        beds: [{ bedNumber: 1 }, { bedNumber: 2 }, { bedNumber: 3 }, { bedNumber: 4 }]
    })),
];

const GIRLS_HOSTELS = ['saraswati', 'shwetambar', 'shwetambara', 'jijau', 'girls'];

export const getRooms = async (req: Request, res: Response) => {
    try {
        let { hostelName } = req.query;

        if (!hostelName) {
            return res.status(400).json({ error: 'Hostel name is required' });
        }

        let rooms = await Room.find({ hostelName }).sort({ floor: 1, roomNumber: 1 });
        
        // Seeding if no rooms exist
        if (rooms.length === 0) {
            console.log(`Seeding rooms for ${hostelName}...`);
            const isGirls = GIRLS_HOSTELS.includes((hostelName as string).toLowerCase());
            const seed = isGirls ? getSeedDataGirls(hostelName as string) : getSeedData(hostelName as string);
            await Room.insertMany(seed);
            rooms = await Room.find({ hostelName }).sort({ floor: 1, roomNumber: 1 });
        }
        
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const bookBed = async (req: Request, res: Response) => {
    const { roomId, bedNumber, studentId } = req.body;

    try {
        const student = await Admission.findById(studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (student.status !== 'accepted') {
            return res.status(403).json({ error: 'Your admission must be "Accepted" to book a room.' });
        }

        if (student.isRoomAllocated) {
            return res.status(400).json({ error: 'You have already been allocated a room.' });
        }

        // Try to update the room's bed
        const room = await Room.findOneAndUpdate(
            { 
                _id: roomId, 
                'beds.bedNumber': bedNumber, 
                'beds.isBooked': false 
            },
            {
                $set: {
                    'beds.$.isBooked': true,
                    'beds.$.studentName': student.fullName,
                    'beds.$.studentBranch': student.department,
                    'beds.$.studentId': studentId
                }
            },
            { returnDocument: 'after' }
        );

        if (!room) {
            return res.status(400).json({ error: 'Bed is already booked or room not found' });
        }

        // Update student allocation status
        await Admission.findByIdAndUpdate(studentId, {
            isRoomAllocated: true,
            allocatedRoom: room.roomNumber,
            allocatedHostel: room.hostelName,
            allocatedBed: bedNumber
        });

        res.json({ success: true, room });
    } catch (error) {
        console.error('Error booking bed:', error);
        res.status(500).json({ error: 'Server error while booking bed' });
    }
};

export const unbookBed = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomId, bedNumber, studentId } = req.body;
        const user = (req as any).user;

        // Only staff/admin can unbook
        if (!user || !['warden', 'rector', 'admin'].includes(user.role)) {
            return res.status(403).json({ error: 'Unauthorized: Only staff can unbook beds' });
        }

        // 1. Reset Room Bed
        const room = await Room.findOneAndUpdate(
            { _id: roomId, "beds.bedNumber": bedNumber },
            {
                $set: {
                    "beds.$.isBooked": false,
                    "beds.$.studentName": null,
                    "beds.$.studentBranch": null,
                    "beds.$.studentId": null
                }
            },
            { returnDocument: 'after' }
        );

        // 2. Reset Student
        if (studentId) {
            await Admission.findByIdAndUpdate(studentId, {
                $set: {
                    isRoomAllocated: false,
                    allocatedRoom: null,
                    allocatedHostel: null,
                    allocatedBed: null
                }
            });
        }

        res.json({ success: true, message: 'Bed unbooked successfully', room });
    } catch (error) {
        console.error('Error unbooking bed:', error);
        res.status(500).json({ error: 'Server error while unbooking bed' });
    }
};

export const getRoommates = async (req: Request, res: Response): Promise<any> => {
    try {
        const { roomNumber, studentId, hostelName } = req.query;

        if (!roomNumber) {
            return res.status(400).json({ error: 'Room number is required' });
        }

        // Find roommates in the SAME room AND SAME hostel
        const query: any = {
            allocatedRoom: roomNumber,
            isRoomAllocated: true
        };

        if (studentId) {
            query._id = { $ne: studentId };
        }

        if (hostelName) {
            query.allocatedHostel = hostelName;
        }

        const roommates = await Admission.find(query).select('fullName department year gender photoUrl');

        res.json(roommates.map(m => ({
            id: m._id,
            name: m.fullName,
            branch: m.department,
            year: m.year,
            photoUrl: m.photoUrl
        })));
    } catch (error) {
        console.error('Error fetching roommates:', error);
        res.status(500).json({ error: 'Server error while fetching roommates' });
    }
};
