const mongoose = require('mongoose');
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_portal';

mongoose.connect(mongoUrl).then(async () => {
    console.log("--- FORCE SYNC START ---");
    
    // Clear all
    await mongoose.connection.db.collection('rooms').updateMany({}, {
        $set: {
            "beds.$[].isBooked": false,
            "beds.$[].studentName": null,
            "beds.$[].studentBranch": null,
            "beds.$[].studentId": null
        }
    });

    const students = await mongoose.connection.db.collection('admissions').find({ isRoomAllocated: true }).toArray();
    
    for (const s of students) {
        let h = s.allocatedHostel;
        let r = s.allocatedRoom;
        let b = parseInt(s.allocatedBed);
        
        console.log(`Processing ${s.fullName}: Hostel [${h}], Room [${r}], Bed [${b}]`);
        
        const roomDoc = await mongoose.connection.db.collection('rooms').findOne({ hostelName: h, roomNumber: r });
        if (!roomDoc) {
            console.log(`  !! Room not found. Creating...`);
            // Create
            await mongoose.connection.db.collection('rooms').insertOne({
                hostelName: h,
                roomNumber: r,
                floor: Math.floor(parseInt(r) / 100) - 1,
                beds: [1,2,3,4].map(n => ({ bedNumber: n, isBooked: false }))
            });
        }
        
        const res = await mongoose.connection.db.collection('rooms').updateOne(
            { hostelName: h, roomNumber: r, "beds.bedNumber": b },
            { 
                $set: { 
                    "beds.$.isBooked": true, 
                    "beds.$.studentName": s.fullName, 
                    "beds.$.studentBranch": s.department, 
                    "beds.$.studentId": s._id.toString() 
                } 
            }
        );
        
        if (res.modifiedCount > 0 || res.matchedCount > 0) {
            console.log(`  >> Successfully updated bed.`);
        } else {
            console.log(`  XX FAILED to update bed. Matched: ${res.matchedCount}`);
        }
    }
    
    process.exit(0);
});
