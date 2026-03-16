const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/campus_portal').then(async () => {
    const admissions = await mongoose.connection.db.collection('admissions').find({ isRoomAllocated: true }).toArray();
    for (const s of admissions) {
        let expectedHostel = s.gender === 'Female' 
            ? 'Jijau Hostel' 
            : (s.year?.includes('2nd') || s.year?.includes('Second') ? 'Lenyadri Hostel' : 
               s.year?.includes('3rd') || s.year?.includes('Third') ? 'Bhimashankar Hostel' : 'Shivneri Hostel');
        
        if (s.allocatedHostel !== expectedHostel) {
            console.log(`Migrating ${s.fullName} from ${s.allocatedHostel} to ${expectedHostel}...`);
            
            // 1. Remove from old room
            if (s.allocatedHostel && s.allocatedRoom) {
                await mongoose.connection.db.collection('rooms').updateOne(
                    { hostelName: s.allocatedHostel, roomNumber: s.allocatedRoom, "beds.bedNumber": s.allocatedBed },
                    { $set: { "beds.$.isBooked": false, "beds.$.studentName": null, "beds.$.studentBranch": null, "beds.$.studentId": null } }
                );
            }
            
            // 2. Ensure new room exists and Add to new room
            // First find if room exists in new hostel
            let roomInNewHostel = await mongoose.connection.db.collection('rooms').findOne({ hostelName: expectedHostel, roomNumber: s.allocatedRoom });
            if (!roomInNewHostel) {
                // If not exists, we should probably not move them to a non-existent room, but for now let's assume it should exist or seed it
                console.log(`Warning: Room ${s.allocatedRoom} not found in ${expectedHostel}. Cannot migrate fully.`);
            } else {
                 await mongoose.connection.db.collection('rooms').updateOne(
                    { hostelName: expectedHostel, roomNumber: s.allocatedRoom, "beds.bedNumber": s.allocatedBed },
                    { $set: { "beds.$.isBooked": true, "beds.$.studentName": s.fullName, "beds.$.studentBranch": s.department, "beds.$.studentId": s._id.toString() } }
                );
            }

            // 3. Update admission record
            await mongoose.connection.db.collection('admissions').updateOne(
                { _id: s._id },
                { $set: { allocatedHostel: expectedHostel } }
            );
        }
    }
    console.log("Migration complete.");
    process.exit(0);
});
