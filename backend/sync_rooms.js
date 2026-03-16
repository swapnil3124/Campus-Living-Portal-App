const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/campus_portal').then(async () => {
    // 1. Clear all bed bookings in all rooms first to start fresh (from the Admission true source)
    await mongoose.connection.db.collection('rooms').updateMany({}, {
        $set: {
            "beds.$[].isBooked": false,
            "beds.$[].studentName": null,
            "beds.$[].studentBranch": null,
            "beds.$[].studentId": null
        }
    });
    console.log("Cleared all room bookings.");

    // 2. Iterate through all allocated students and book their beds
    const admissions = await mongoose.connection.db.collection('admissions').find({ isRoomAllocated: true }).toArray();
    for (const s of admissions) {
        let hostel = s.allocatedHostel;
        let room = s.allocatedRoom;
        let bed = s.allocatedBed;

        if (hostel && room && bed) {
            console.log(`Booking ${s.fullName} in ${hostel} Room ${room} Bed ${bed}...`);
            const res = await mongoose.connection.db.collection('rooms').updateOne(
                { hostelName: hostel, roomNumber: room, "beds.bedNumber": bed },
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
                 console.log(`Warning: Room ${room} in ${hostel} not found. Seeding first...`);
                 // Simplest is to call the seed logic or just create the one room
                 // But for now let's just create it manually
                 await mongoose.connection.db.collection('rooms').insertOne({
                     hostelName: hostel,
                     roomNumber: room,
                     floor: parseInt(room[0]) || 0,
                     beds: [
                         { bedNumber: 1, isBooked: false }, { bedNumber: 2, isBooked: false }, 
                         { bedNumber: 3, isBooked: false }, { bedNumber: 4, isBooked: false }
                     ]
                 });
                 // Try again
                 await mongoose.connection.db.collection('rooms').updateOne(
                    { hostelName: hostel, roomNumber: room, "beds.bedNumber": bed },
                    { 
                        $set: { 
                            "beds.$.isBooked": true, 
                            "beds.$.studentName": s.fullName, 
                            "beds.$.studentBranch": s.department, 
                            "beds.$.studentId": s._id.toString() 
                        } 
                    }
                );
            }
        }
    }
    console.log("Sync complete.");
    process.exit(0);
});
