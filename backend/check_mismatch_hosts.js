const mongoose = require('mongoose');
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_portal';

mongoose.connect(mongoUrl).then(async () => {
    const roomHotels = await mongoose.connection.db.collection('rooms').distinct('hostelName');
    const adminHotels = await mongoose.connection.db.collection('admissions').distinct('allocatedHostel');
    
    console.log("Room Hostels:", roomHotels);
    console.log("Admission Hostels:", adminHotels);
    
    const mismatch = await mongoose.connection.db.collection('admissions').find({ 
        isRoomAllocated: true,
        allocatedHostel: { $nin: roomHotels }
    }).toArray();
    
    console.log("Students with hostel mismatch:", mismatch.length);
    mismatch.forEach(s => console.log(`  - ${s.fullName}: ${s.allocatedHostel}`));

    process.exit(0);
});
