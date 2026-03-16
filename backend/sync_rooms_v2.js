const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/campus_portal').then(async () => {
    try {
        console.log("Dropping old roomNumber_1 index...");
        await mongoose.connection.db.collection('rooms').dropIndex('roomNumber_1');
    } catch (e) {
        console.log("No old index found or already dropped.");
    }

    // Clear all bed bookings
    await mongoose.connection.db.collection('rooms').updateMany({}, {
        $set: {
            "beds.$[].isBooked": false,
            "beds.$[].studentName": null,
            "beds.$[].studentBranch": null,
            "beds.$[].studentId": null
        }
    });
    console.log("Cleared all room bookings.");

    const admissions = await mongoose.connection.db.collection('admissions').find({ isRoomAllocated: true }).toArray();
    for (const s of admissions) {
        let hostel = s.allocatedHostel;
        let room = s.allocatedRoom;
        let bed = s.allocatedBed;

        if (hostel && room && bed) {
            // Normalize hostel name just in case
            hostel = hostel.toLowerCase().includes('shivneri') ? 'Shivneri Hostel' :
                     hostel.toLowerCase().includes('lenyadri') ? 'Lenyadri Hostel' :
                     hostel.toLowerCase().includes('bhimashankar') ? 'Bhimashankar Hostel' :
                     hostel.toLowerCase().includes('jijau') ? 'Jijau Hostel' :
                     hostel.toLowerCase().includes('shwetambara') ? 'Shwetambara Hostel' :
                     hostel.toLowerCase().includes('saraswati') ? 'Saraswati Hostel' : hostel;

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
                 console.log(`Creating Room ${room} in ${hostel}...`);
                 const beds = [1,2,3,4].map(bn => ({
                     bedNumber: bn,
                     isBooked: bn === bed,
                     studentName: bn === bed ? s.fullName : null,
                     studentBranch: bn === bed ? s.department : null,
                     studentId: bn === bed ? s._id.toString() : null
                 }));
                 await mongoose.connection.db.collection('rooms').insertOne({
                     hostelName: hostel,
                     roomNumber: room,
                     floor: parseInt(room[0]) || 0,
                     beds: beds
                 });
            } else {
                 console.log(`Synced ${s.fullName} in ${hostel} Room ${room}.`);
            }
        }
    }
    console.log("Global sync complete.");
    process.exit(0);
});
