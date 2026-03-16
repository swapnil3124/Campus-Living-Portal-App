const mongoose = require('mongoose');
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_portal';

const normalize = (h) => {
    if (!h) return h;
    // Replace all whitespaces (including newlines) with a single space
    const cleaned = h.replace(/\s+/g, ' ').trim();
    const lower = cleaned.toLowerCase();
    if (lower === 'shivneri' || lower === 'shivneri hostel') return 'Shivneri Hostel';
    if (lower === 'lenyadri' || lower === 'lenyadri hostel') return 'Lenyadri Hostel';
    if (lower === 'bhimashankar' || lower === 'bhimashankar hostel') return 'Bhimashankar Hostel';
    if (lower === 'shwetambara' || lower === 'shwetambara hostel') return 'Shwetambara Hostel';
    if (lower === 'saraswati' || lower === 'saraswati hostel') return 'Saraswati Hostel';
    if (lower === 'jijau' || lower === 'jijau hostel') return 'Jijau Hostel';
    return cleaned;
};

mongoose.connect(mongoUrl).then(async () => {
    console.log("--- STARTING CORRECTED FINAL SYNC ---");

    // 1. Normalize all Admission records - Truth Source
    const admissions = await mongoose.connection.db.collection('admissions').find({ isRoomAllocated: true }).toArray();
    for (const s of admissions) {
        const fixedHostel = normalize(s.allocatedHostel);
        const fixedBed = parseInt(s.allocatedBed);
        
        await mongoose.connection.db.collection('admissions').updateOne(
            { _id: s._id },
            { $set: { allocatedHostel: fixedHostel, allocatedBed: fixedBed } }
        );
        console.log(`Fixed Admission: ${s.fullName} -> ${fixedHostel}`);
    }

    // 2. Clear and Re-Normalize all Room records
    // Delete duplicate or malformed rooms first to avoid index conflicts
    const rooms = await mongoose.connection.db.collection('rooms').find({}).toArray();
    for (const r of rooms) {
        const fixedHostel = normalize(r.hostelName);
        if (fixedHostel !== r.hostelName) {
            // Check if room with fixedHostel already exists
            const existing = await mongoose.connection.db.collection('rooms').findOne({ hostelName: fixedHostel, roomNumber: r.roomNumber });
            if (existing) {
                console.log(`Merging/Deleting duplicate: Room ${r.roomNumber} in ${r.hostelName}`);
                await mongoose.connection.db.collection('rooms').deleteOne({ _id: r._id });
            } else {
                await mongoose.connection.db.collection('rooms').updateOne({ _id: r._id }, { $set: { hostelName: fixedHostel } });
                console.log(`Fixed Room ${r.roomNumber} hostel name.`);
            }
        }
    }

    // 3. Reset all bookings in all rooms
    await mongoose.connection.db.collection('rooms').updateMany({}, {
        $set: {
            "beds.$[].isBooked": false,
            "beds.$[].studentName": null,
            "beds.$[].studentBranch": null,
            "beds.$[].studentId": null
        }
    });

    // 4. Sync from Admissions
    const finalAdmissions = await mongoose.connection.db.collection('admissions').find({ isRoomAllocated: true }).toArray();
    for (const s of finalAdmissions) {
        const res = await mongoose.connection.db.collection('rooms').updateOne(
            { 
                hostelName: s.allocatedHostel, 
                roomNumber: s.allocatedRoom, 
                "beds.bedNumber": s.allocatedBed 
            },
            { 
                $set: { 
                    "beds.$.isBooked": true, 
                    "beds.$.studentName": s.fullName, 
                    "beds.$.studentBranch": s.department, 
                    "beds.$.studentId": s._id.toString() 
                } 
            }
        );
        
        if (res.matchedCount === 0) {
            console.log(`RE-CREATING: ${s.fullName} -> ${s.allocatedHostel} Room ${s.allocatedRoom}`);
            const beds = [1,2,3,4].map(bn => ({
                bedNumber: bn,
                isBooked: bn === s.allocatedBed,
                studentName: bn === s.allocatedBed ? s.fullName : null,
                studentBranch: bn === s.allocatedBed ? s.department : null,
                studentId: bn === s.allocatedBed ? s._id.toString() : null
            }));
            await mongoose.connection.db.collection('rooms').insertOne({
                hostelName: s.allocatedHostel,
                roomNumber: s.allocatedRoom,
                floor: Math.floor(parseInt(s.allocatedRoom) / 100) - 1,
                beds: beds
            });
        } else {
            console.log(`BOOKED: ${s.fullName} in ${s.allocatedHostel} Room ${s.allocatedRoom}`);
        }
    }

    console.log("--- SYNC SUCCESSFUL ---");
    process.exit(0);
});
