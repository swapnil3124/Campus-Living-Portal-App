import { Request, Response } from 'express';
import Admission from '../models/Admission';
import SystemConfig from '../models/SystemConfig';
import MeritList from '../models/MeritList';
import { Announcement } from '../models/Announcement';
import * as xlsx from 'xlsx';
import { sendStudentLoginCredentials } from '../utils/emailService';

export const generateMeritList = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { role, subRole } = user;
        
        const config = await SystemConfig.findOne({ key: 'merit_list' });
        if (!config) {
            return res.status(400).json({ message: 'Merit list settings not found' });
        }

        const { departmentSeats, categoryPercentages } = config.value;

        // Apply strict filtering based on warden scope
        let query: any = { status: 'accepted' };
        if (role === 'admin' && subRole) {
            const hNameRaw = subRole.toLowerCase();
            if (hNameRaw === 'shivneri') {
                query.year = '1st';
                query.gender = { $regex: /^male$/i };
            } else if (hNameRaw === 'lenyadri') {
                query.year = '2nd';
                query.gender = { $regex: /^male$/i };
            } else if (hNameRaw === 'bhimashankar') {
                query.year = '3rd';
                query.gender = { $regex: /^male$/i };
            } else if (hNameRaw === 'saraswati') {
                query.year = '1st';
                query.gender = { $regex: /^female$/i };
            } else if (['shwetamber', 'shwetambara'].includes(hNameRaw)) {
                query.year = { $in: ['2nd', '3rd'] };
                query.gender = { $regex: /^female$/i };
            }
        } else if (role === 'rector' && subRole) {
             const hNameRaw = subRole.toLowerCase();
             if (hNameRaw === 'boys') {
                 query.gender = { $regex: /^male$/i };
             } else if (hNameRaw === 'girls') {
                 query.gender = { $regex: /^female$/i };
             }
        }

        const admissions = await Admission.find(query)
            .select('fullName enrollment prevMarks department category year gender _id');

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
                settings: config.value,
                hostelName: subRole || 'General'
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
        const user = (req as any).user;
        let query: any = {};

        // Wardens only see lists for their hostel
        if (user.role === 'admin' && user.subRole) {
            query.hostelName = user.subRole;
        } else if (user.role === 'rector' && user.subRole) {
            // Rector sees either boys or girls lists
            if (user.subRole === 'boys') {
                query.hostelName = { $in: ['shivneri', 'lenyadri', 'bhimashankar'] };
            } else if (user.subRole === 'girls') {
                query.hostelName = { $in: ['saraswati', 'shwetambara', 'shwetamber', 'jijau'] };
            }
        }

        const lists = await MeritList.find(query).select('-students.photoUrl').sort({ generatedAt: -1 });
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
        const user = (req as any).user;
        if (user.role !== 'rector') {
            return res.status(403).json({ message: 'Access denied: Only a Rector can publish merit lists.' });
        }

        const { hostelName } = req.body;
        if (!hostelName) return res.status(400).json({ message: 'Hostel name is required to publish.' });

        const list = await MeritList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'Merit list not found' });

        const title = `Merit List Published: ${hostelName} Hostel`;

        // Check if an announcement already exists for this hostel
        const existingAnnouncement = await Announcement.findOne({ message: title, isActive: true });

        list.status = 'published';
        await list.save();

        if (!existingAnnouncement) {
            // Create an announcement automatically using the Hostel Name
            const announcement = new Announcement({
                message: title,
                details: `The merit list for ${hostelName} Hostel has been published. Selected students, please check the downloadable list attached.`,
                startDate: new Date(),
                endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Active for 15 days
                isActive: true,
                createdBy: 'System (Rector)',
                fileUrl: `/api/merit/hostel/export?hostelName=${encodeURIComponent(hostelName)}`
            });
            await announcement.save();
        }

        res.json({ message: 'Merit list published successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const exportMeritList = async (req: Request, res: Response) => {
    try {
        const { hostel } = req.query;
        const list = await MeritList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'Merit list not found' });

        let students = list.students;
        const hNameRaw = (hostel as string || '').toLowerCase();

        // Filter Students based on the requested Hostel
        if (hNameRaw) {
            if (hNameRaw === 'shivneri') {
                students = students.filter((s: any) => s.year === '1st' && s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'lenyadri') {
                students = students.filter((s: any) => s.year === '2nd' && s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'bhimashankar') {
                students = students.filter((s: any) => s.year === '3rd' && s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'saraswati') {
                students = students.filter((s: any) => s.year === '1st' && s.gender?.toLowerCase() === 'female');
            } else if (['shwetamber', 'shwetambara'].includes(hNameRaw)) {
                students = students.filter((s: any) => ['2nd', '3rd'].includes(s.year) && s.gender?.toLowerCase() === 'female');
            } else if (hNameRaw === 'boys') {
                students = students.filter((s: any) => s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'girls') {
                students = students.filter((s: any) => s.gender?.toLowerCase() === 'female');
            }
        }

        const data = students.map((s: any) => ({
            Rank: s.rank,
            Enrollment: s.enrollment,
            'Full Name': s.fullName,
            Gender: s.gender,
            'Previous Marks': s.prevMarks,
            Category: s.category,
            'Selection Category': s.selectionCategory
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Merit List");

        const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const cleanHostelName = (hostel as string || list.department).replace(/[^a-zA-Z0-9_-]/g, '_');

        res.setHeader('Content-Disposition', `attachment; filename="${cleanHostelName}_Merit_List.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const exportHostelWiseMeritList = async (req: Request, res: Response) => {
    try {
        const { hostelName } = req.query;
        if (!hostelName) return res.status(400).json({ message: 'Hostel name is required' });

        const lists = await MeritList.find({ status: 'published' });

        let allStudents = lists.flatMap(l => l.students.map((s: any) => ({ ...s.toObject(), department: l.department })));
        const hNameRaw = (hostelName as string).toLowerCase();

        if (hNameRaw) {
            if (hNameRaw === 'shivneri') {
                allStudents = allStudents.filter((s: any) => s.year === '1st' && s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'lenyadri') {
                allStudents = allStudents.filter((s: any) => s.year === '2nd' && s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'bhimashankar') {
                allStudents = allStudents.filter((s: any) => s.year === '3rd' && s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'saraswati') {
                allStudents = allStudents.filter((s: any) => s.year === '1st' && s.gender?.toLowerCase() === 'female');
            } else if (['shwetamber', 'shwetambara'].includes(hNameRaw)) {
                allStudents = allStudents.filter((s: any) => ['2nd', '3rd'].includes(s.year) && s.gender?.toLowerCase() === 'female');
            } else if (hNameRaw === 'boys') {
                allStudents = allStudents.filter((s: any) => s.gender?.toLowerCase() === 'male');
            } else if (hNameRaw === 'girls') {
                allStudents = allStudents.filter((s: any) => s.gender?.toLowerCase() === 'female');
            }
        }

        // Sort by department for better readability
        allStudents.sort((a, b) => (a.department || '').localeCompare(b.department || ''));

        const data = allStudents.map((s: any) => ({
            Rank: s.rank,
            Enrollment: s.enrollment,
            'Full Name': s.fullName,
            Gender: s.gender,
            'Department': s.department,
            'Previous Marks': s.prevMarks,
            Category: s.category,
            'Selection Category': s.selectionCategory
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Merit List");

        const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const cleanHostelName = (hostelName as string).replace(/[^a-zA-Z0-9_-]/g, '_');

        res.setHeader('Content-Disposition', `attachment; filename="${cleanHostelName}_Merit_List.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
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
        const { admissionIds } = req.body;
        const list = await MeritList.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'Merit list not found' });

        let studentIds = list.students.map(s => s.admissionId.toString());
        if (admissionIds && Array.isArray(admissionIds)) {
            studentIds = studentIds.filter(id => admissionIds.includes(id));
        }

        const admissions = await Admission.find({ _id: { $in: studentIds } });
        let newPasswordsCount = 0;
        const generatedList = [];

        for (const admission of admissions) {
            // Only generate if one doesn't already exist (or overwrite if desired. For now, we will create a new one every time to ensure they get it)
            const password = Math.random().toString(36).slice(-8); // Generate an 8-character random string
            admission.studentPassword = password;
            await admission.save();
            newPasswordsCount++;

            generatedList.push({
                enrollment: admission.enrollment,
                fullName: admission.fullName,
                password: password,
                email: admission.email
            });

            // MOCK EMAIL SENDING
            console.log(`[MAIL MOCK] Sent email to ${admission.email || 'unknown'} -> Welcome to ${list.department}! Your login is: Username: ${admission.enrollment} | Password: ${password}`);
        }

        res.json({ message: `Successfully generated ${newPasswordsCount} passwords.`, passwords: generatedList });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const dispatchEmails = async (req: Request, res: Response) => {
    try {
        const { students } = req.body;
        console.log(`[dispatchEmails] Received ${students?.length} students. Sample:`, students?.[0]);
        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ message: 'A valid list of students is required.' });
        }

        let sentCount = 0;
        const failedEmails = [];

        for (const student of students) {
            console.log(`[dispatchEmails] Processing: ${student.fullName}, Email: ${student.email}, Pass: ${student.password}`);
            if (student.email && student.password) {
                const success = await sendStudentLoginCredentials(student.fullName, student.enrollment, student.email, student.password);
                if (success) {
                    sentCount++;
                } else {
                    failedEmails.push(student.email);
                }
            }
        }

        res.json({
            message: `Successfully sent ${sentCount} emails.`,
            sentCount,
            failedEmails
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
