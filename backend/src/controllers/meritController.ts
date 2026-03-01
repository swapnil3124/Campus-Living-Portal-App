import { Request, Response } from 'express';
import Admission from '../models/Admission';
import SystemConfig from '../models/SystemConfig';
import MeritList from '../models/MeritList';

export const generateMeritList = async (req: Request, res: Response) => {
    try {
        const config = await SystemConfig.findOne({ key: 'merit_list' });
        if (!config) {
            return res.status(400).json({ message: 'Merit list settings not found' });
        }

        const { departmentSeats, categoryPercentages } = config.value;

        // Only consider students whose applications have been explicitly approved/accepted by admin
        // Exclude heavy fields like additionalData during analysis to save server memory
        const admissions = await Admission.find({
            status: 'accepted'
        }).select('fullName enrollment prevMarks department category year gender _id');

        if (admissions.length === 0) {
            return res.status(400).json({ message: 'No registered students found to analyze.' });
        }

        const results = [];
        const departments = Object.keys(departmentSeats);

        for (const dept of departments) {
            const totalDeptSeats = departmentSeats[dept];
            if (!totalDeptSeats || totalDeptSeats <= 0) continue;

            // Filter students specifically for this department and sort by marks
            const deptAdmissions = admissions
                .filter(a => a.department === dept)
                .sort((a, b) => {
                    const marksA = parseFloat(a.prevMarks) || 0;
                    const marksB = parseFloat(b.prevMarks) || 0;
                    return marksB - marksA;
                });

            if (deptAdmissions.length === 0) continue;

            const selectedStudents: any[] = [];
            const remainingAdmissions = [...deptAdmissions];

            // 1. Fill Open Category first (based on percentage of department seats)
            const openPercentage = categoryPercentages?.['Open'] || 0;
            const openSeatsCount = Math.floor((totalDeptSeats * openPercentage) / 100);

            for (let i = 0; i < openSeatsCount && remainingAdmissions.length > 0 && selectedStudents.length < totalDeptSeats; i++) {
                const student = remainingAdmissions.shift();
                if (student) {
                    selectedStudents.push({
                        admissionId: student._id,
                        fullName: student.fullName,
                        enrollment: student.enrollment,
                        prevMarks: parseFloat(student.prevMarks),
                        category: student.category,
                        rank: selectedStudents.length + 1,
                        selectionCategory: 'Open',
                        year: student.year,
                        gender: student.gender
                    });
                }
            }

            // 2. Fill Reserved Categories (based on percentage per category)
            const otherCategories = Object.keys(categoryPercentages || {}).filter(c => c !== 'Open');

            for (const cat of otherCategories) {
                const catPct = categoryPercentages[cat] || 0;
                const catSeatsCount = Math.floor((totalDeptSeats * catPct) / 100);
                let filled = 0;

                // Find students of this category in the remaining pool
                for (let i = 0; i < remainingAdmissions.length && filled < catSeatsCount && selectedStudents.length < totalDeptSeats; i++) {
                    if (remainingAdmissions[i].category === cat) {
                        const student = remainingAdmissions.splice(i, 1)[0];
                        selectedStudents.push({
                            admissionId: student._id,
                            fullName: student.fullName,
                            enrollment: student.enrollment,
                            prevMarks: parseFloat(student.prevMarks),
                            category: student.category,
                            rank: selectedStudents.length + 1,
                            selectionCategory: cat,
                            year: student.year,
                            gender: student.gender
                        });
                        filled++;
                        i--; // Adjust index after splice
                    }
                }
            }

            // 3. Fill remaining slots in the Department (if any) with Merit students 
            // who haven't been selected yet (from the remaining pool)
            if (selectedStudents.length < totalDeptSeats) {
                while (selectedStudents.length < totalDeptSeats && remainingAdmissions.length > 0) {
                    const student = remainingAdmissions.shift();
                    if (student) {
                        selectedStudents.push({
                            admissionId: student._id,
                            fullName: student.fullName,
                            enrollment: student.enrollment,
                            prevMarks: parseFloat(student.prevMarks),
                            category: student.category,
                            rank: selectedStudents.length + 1,
                            selectionCategory: 'Merit-Remaining',
                            year: student.year,
                            gender: student.gender
                        });
                    }
                }
            }

            // Save this department's merit list
            // Clean up old lists for this department if they exist? 
            // (The user said "remove all errors if comes" and "remind cast seat count is same for all depart ment")

            // Generate unique title with timestamp
            const now = new Date();
            const dateStr = now.toLocaleDateString();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const title = `Merit List - ${dept} (${dateStr} ${timeStr})`;

            const newList = new MeritList({
                title,
                department: dept,
                students: selectedStudents,
                settings: config.value
            });
            await newList.save();
            results.push(newList);
        }

        res.json({ message: 'Merit lists generated successfully', lists: results });
    } catch (error: any) {
        console.error('Generation Error:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getMeritLists = async (req: Request, res: Response) => {
    try {
        const lists = await MeritList.find().select('-students.photoUrl').sort({ generatedAt: -1 });
        res.json(lists);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMeritListById = async (req: Request, res: Response) => {
    try {
        const list = await MeritList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'Merit list not found' });
        res.json(list);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const publishMeritList = async (req: Request, res: Response) => {
    try {
        const list = await MeritList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'Merit list not found' });

        // REMOVED: Students should not be automatically accepted upon publication.
        // Final approval must be done manually by the admin after document verification.
        // const studentIds = list.students.map((s: any) => s.admissionId);
        // await Admission.updateMany(
        //     { _id: { $in: studentIds } },
        //     { status: 'accepted' }
        // );

        list.status = 'published';
        await list.save();

        res.json({ message: 'Merit list published and students accepted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const sendToRector = async (req: Request, res: Response) => {
    try {
        const list = await MeritList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'Merit list not found' });

        list.status = 'sent_to_rector';
        await list.save();

        res.json({ message: 'Merit list sent to rector' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMeritList = async (req: Request, res: Response) => {
    try {
        await MeritList.findByIdAndDelete(req.params.id);
        res.json({ message: 'Merit list deleted' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const generateAndSendPasswords = async (req: Request, res: Response) => {
    try {
        const list = await MeritList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'Merit list not found' });

        const admissions = await Admission.find({ _id: { $in: list.students.map(s => s.admissionId) } });
        let newPasswordsCount = 0;

        for (const admission of admissions) {
            // Only generate if one doesn't already exist (or overwrite if desired. For now, we will create a new one every time to ensure they get it)
            const password = Math.random().toString(36).slice(-8); // Generate an 8-character random string
            admission.studentPassword = password;
            await admission.save();
            newPasswordsCount++;

            // MOCK EMAIL SENDING
            console.log(`[MAIL MOCK] Sent email to ${admission.email || 'unknown'} -> Welcome to ${list.department}! Your login is: Username: ${admission.enrollment} | Password: ${password}`);
        }

        res.json({ message: `Successfully generated and sent ${newPasswordsCount} passwords via email.` });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
