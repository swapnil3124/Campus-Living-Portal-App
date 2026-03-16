const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/campus_portal').then(async () => {
    // Fix rooms
    const rooms = await mongoose.connection.db.collection('rooms').find({}).toArray();
    for (const room of rooms) {
        if (room.hostelName) {
            const fixed = room.hostelName.replace(/\s+/g, ' ').trim();
            if (fixed !== room.hostelName) {
                await mongoose.connection.db.collection('rooms').updateOne({ _id: room._id }, { $set: { hostelName: fixed } });
                console.log(`Fixed room hostel: "${room.hostelName}" -> "${fixed}"`);
            }
        }
    }
    
    // Fix admissions
    const admissions = await mongoose.connection.db.collection('admissions').find({ isRoomAllocated: true }).toArray();
    for (const adm of admissions) {
        if (adm.allocatedHostel) {
            const fixed = adm.allocatedHostel.replace(/\s+/g, ' ').trim();
            if (fixed !== adm.allocatedHostel) {
                await mongoose.connection.db.collection('admissions').updateOne({ _id: adm._id }, { $set: { allocatedHostel: fixed } });
                console.log(`Fixed adm hostel: "${adm.allocatedHostel}" -> "${fixed}"`);
            }
        }
    }
    
    process.exit(0);
});
