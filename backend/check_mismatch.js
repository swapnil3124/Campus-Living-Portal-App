const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/campus_portal').then(async () => {
    const admissions = await mongoose.connection.db.collection('admissions').find({ isRoomAllocated: true }).toArray();
    for (const s of admissions) {
        let expectedHostel = s.gender === 'Female' 
            ? 'Jijau Hostel' 
            : (s.year?.includes('2nd') || s.year?.includes('Second') ? 'Lenyadri Hostel' : 
               s.year?.includes('3rd') || s.year?.includes('Third') ? 'Bhimashankar Hostel' : 'Shivneri Hostel');
        
        if (s.allocatedHostel !== expectedHostel) {
            console.log(`Mismatch for ${s.fullName}: Has "${s.allocatedHostel}", Expected "${expectedHostel}"`);
        }
    }
    process.exit(0);
});
