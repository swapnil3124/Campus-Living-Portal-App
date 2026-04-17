import { Request, Response } from 'express';
import Admission from '../models/Admission';
import SystemConfig from '../models/SystemConfig';
import MeritList from '../models/MeritList';
import { Announcement } from '../models/Announcement';
import * as xlsx from 'xlsx';
import { sendStudentLoginCredentials } from '../utils/emailService';
import { getIO } from '../socket';

export const generateMeritList = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { role, subRole } = user;
        
        const isGirlsSide = role === 'rector' && subRole?.toLowerCase() === 'girls';
        const configKey = isGirlsSide ? 'girls_merit_list_config' : 'merit_list';
        
        const config = await SystemConfig.findOne({ key: configKey });
        if (!config) {
            return res.status(400).json({ message: 'Merit list settings not found' });
        }

        const { departmentSeats, categoryPercentages, yearSeats } = config.value;

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
            .select('fullName enrollment prevMarks department category year gender email _id');

        if (admissions.length === 0) {
            return res.status(400).json({ message: 'No registered students found to analyze.' });
        }

        const results = [];
        const yearCounters: Record<string, number> = { '1st': 0, '2nd': 0, '3rd': 0 };

        if (isGirlsSide && yearSeats) {
            // GIRLS SIDE: Year-wise generation
            const years = ['1st', '2nd', '3rd'];

            for (const year of years) {
                const totalYearSeats = yearSeats[year] || 0;
                if (totalYearSeats <= 0) continue;

                // Filter students specifically for this year and sort by marks
                const yearAdmissions = admissions
                    .filter(a => a.year === year)
                    .sort((a, b) => {
                        const marksA = parseFloat(a.prevMarks) || 0;
                        const marksB = parseFloat(b.prevMarks) || 0;
                        return marksB - marksA;
                    });

                if (yearAdmissions.length === 0) continue;

                const selectedStudents: any[] = [];
                const remainingAdmissions = [...yearAdmissions];

                // 1. Fill Open Category
                const openPercentage = categoryPercentages?.['Open'] || 0;
                const openSeatsCount = Math.floor((totalYearSeats * openPercentage) / 100);

                for (let i = 0; i < remainingAdmissions.length && selectedStudents.length < openSeatsCount && selectedStudents.length < totalYearSeats; i++) {
                    const student = remainingAdmissions[i];
                    remainingAdmissions.splice(i, 1);
                    selectedStudents.push({
                        admissionId: student._id,
                        fullName: student.fullName,
                        enrollment: student.enrollment,
                        prevMarks: parseFloat(student.prevMarks),
                        category: student.category,
                        rank: selectedStudents.length + 1,
                        selectionCategory: 'Open',
                        year: student.year,
                        gender: student.gender,
                        email: student.email
                    });
                    i--;
                }

                // 2. Fill Reserved Categories
                const otherCategories = Object.keys(categoryPercentages || {}).filter(c => c !== 'Open');

                for (const cat of otherCategories) {
                    const catPct = categoryPercentages[cat] || 0;
                    const catSeatsLimit = Math.floor((totalYearSeats * catPct) / 100);
                    let filled = 0;

                    for (let i = 0; i < remainingAdmissions.length && filled < catSeatsLimit && selectedStudents.length < totalYearSeats; i++) {
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
                                gender: student.gender,
                                email: student.email
                            });
                            filled++;
                            i--;
                        }
                    }
                }

                // 3. Fill remaining slots
                if (selectedStudents.length < totalYearSeats) {
                    for (let i = 0; i < remainingAdmissions.length && selectedStudents.length < totalYearSeats; i++) {
                        const student = remainingAdmissions[i];
                        remainingAdmissions.splice(i, 1);
                        selectedStudents.push({
                            admissionId: student._id,
                            fullName: student.fullName,
                            enrollment: student.enrollment,
                            prevMarks: parseFloat(student.prevMarks),
                            category: student.category,
                            rank: selectedStudents.length + 1,
                            selectionCategory: 'Merit-Remaining',
                            year: student.year,
                            gender: student.gender,
                            email: student.email
                        });
                        i--;
                    }
                }

                const now = new Date();
                const dateStr = now.toLocaleDateString();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const title = `Girls Merit List - ${year} Year (${dateStr} ${timeStr})`;

                const newList = new MeritList({
                    title,
                    department: `${year} Year`, // For girls we use year as department
                    students: selectedStudents,
                    settings: config.value,
                    hostelName: 'Girls', // General girls label
                    status: 'draft' // Set to draft for manual publish/review
                });
                await newList.save();
                results.push(newList);
            }
        } else {
            // BOYS SIDE or fallback: Department-wise generation
            const departments = Object.keys(departmentSeats);
            for (const dept of departments) {
                const totalDeptSeats = departmentSeats[dept];
                if (!totalDeptSeats || totalDeptSeats <= 0) continue;

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

                // 1. Fill Open Category
                const openPercentage = categoryPercentages?.['Open'] || 0;
                const openSeatsCount = Math.floor((totalDeptSeats * openPercentage) / 100);

                for (let i = 0; i < remainingAdmissions.length && selectedStudents.length < openSeatsCount && selectedStudents.length < totalDeptSeats; i++) {
                    const student = remainingAdmissions[i];
                    remainingAdmissions.splice(i, 1);
                    selectedStudents.push({
                        admissionId: student._id,
                        fullName: student.fullName,
                        enrollment: student.enrollment,
                        prevMarks: parseFloat(student.prevMarks),
                        category: student.category,
                        rank: selectedStudents.length + 1,
                        selectionCategory: 'Open',
                        year: student.year,
                        gender: student.gender,
                        email: student.email
                    });
                    i--;
                }

                // 2. Fill Reserved Categories
                const otherCategories = Object.keys(categoryPercentages || {}).filter(c => c !== 'Open');

                for (const cat of otherCategories) {
                    const catPct = categoryPercentages[cat] || 0;
                    const catSeatsLimit = Math.floor((totalDeptSeats * catPct) / 100);
                    let filled = 0;

                    for (let i = 0; i < remainingAdmissions.length && filled < catSeatsLimit && selectedStudents.length < totalDeptSeats; i++) {
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
                                gender: student.gender,
                                email: student.email
                            });
                            filled++;
                            i--;
                        }
                    }
                }

                // 3. Fill remaining slots
                if (selectedStudents.length < totalDeptSeats) {
                    for (let i = 0; i < remainingAdmissions.length && selectedStudents.length < totalDeptSeats; i++) {
                        const student = remainingAdmissions[i];
                        remainingAdmissions.splice(i, 1);
                        selectedStudents.push({
                            admissionId: student._id,
                            fullName: student.fullName,
                            enrollment: student.enrollment,
                            prevMarks: parseFloat(student.prevMarks),
                            category: student.category,
                            rank: selectedStudents.length + 1,
                            selectionCategory: 'Merit-Remaining',
                            year: student.year,
                            gender: student.gender,
                            email: student.email
                        });
                        i--;
                    }
                }

                const now = new Date();
                const dateStr = now.toLocaleDateString();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const title = `Merit List - ${dept} (${dateStr} ${timeStr})`;

                const newList = new MeritList({
                    title,
                    department: dept,
                    students: selectedStudents,
                    settings: config.value,
                    hostelName: subRole || 'General',
                    status: 'draft'
                });
                await newList.save();
                results.push(newList);
            }
        }

        getIO().emit('merits_updated');
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
                query.hostelName = { $in: ['shivneri', 'lenyadri', 'bhimashankar', 'boys', 'Shivneri', 'Lenyadri', 'Bhimashankar', 'Boys'] };
            } else if (user.subRole === 'girls') {
                // Girls lists are saved with hostelName: 'Girls' by the rector
                query.hostelName = { $in: ['saraswati', 'shwetambara', 'shwetamber', 'jijau', 'girls', 'Girls'] };
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
            // Generate filename for the URL to help browser recognition
            const currentYear = new Date().getFullYear();
            const cleanHostelName = hostelName.replace(/\s+/g, '_');
            const isGirlsHostel = ['saraswati', 'shwetambara', 'shwetamber', 'girls'].some(h => hostelName.toLowerCase().includes(h));
            
            let excelFilename = `${cleanHostelName}_Merit_List_${currentYear}.xlsx`;
            if (isGirlsHostel) {
                // For girls, use Year_Wise as per prompt if it's a general list, otherwise use hostel name
                const isYearBased = ['1st', '2nd', '3rd'].some(y => hostelName.includes(y));
                excelFilename = isYearBased 
                    ? `${cleanHostelName}_Year_Girls_Merit_List_${currentYear}.xlsx`
                    : `Year_Wise_Girls_Merit_List_${currentYear}.xlsx`;
            }

            // Create an announcement automatically with a path-based download link for better browser handling
            const announcement = new Announcement({
                message: title,
                details: `The merit list for ${hostelName} Hostel has been published. Selected students, please check the downloadable list attached.`,
                startDate: new Date(),
                endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Active for 15 days
                isActive: true,
                createdBy: 'System (Rector)',
                // Add filename to the URL to ensure it downloads as .xlsx on mobile/browser
                fileUrl: `/api/merit/hostel/export/${encodeURIComponent(excelFilename)}?hostelName=${encodeURIComponent(hostelName)}`
            });
            await announcement.save();
            getIO().emit('announcements_updated');
        }

        getIO().emit('merits_updated');
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
        const currentYear = new Date().getFullYear();
        const rawName = (hostel as string || list.department || 'Merit');
        const cleanName = rawName.replace(/\s+/g, '_');

        const yearBased = ['1st', '2nd', '3rd'].some(y => rawName.startsWith(y));
        const excelFilename = yearBased
            ? `${cleanName}_Year_Girls_Merit_List_${currentYear}.xlsx`
            : `${cleanName}_Merit_List_${currentYear}.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${excelFilename}"`);
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
        const currentYear = new Date().getFullYear();
        const cleanName = (hostelName as string).replace(/\s+/g, '_');

        // Build a descriptive filename
        const yearBased = ['1st', '2nd', '3rd'].some(y => (hostelName as string).startsWith(y));
        const excelFilename = yearBased
            ? `${cleanName}_Year_Girls_Merit_List_${currentYear}.xlsx`
            : `${cleanName}_Merit_List_${currentYear}.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${excelFilename}"`);
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

        getIO().emit('merits_updated');
        res.json({ message: 'Merit list sent to rector' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMeritList = async (req: Request, res: Response) => {
    try {
        await MeritList.findByIdAndDelete(req.params.id);
        getIO().emit('merits_updated');
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
