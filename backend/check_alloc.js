const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/campus_portal').then(async () => {
    const allocatedCount = await mongoose.connection.db.collection('admissions').countDocuments({ isRoomAllocated: true });
    console.log('Allocated Admissions:', allocatedCount);
    
    const allocatedSamples = await mongoose.connection.db.collection('admissions').find({ isRoomAllocated: true }).limit(5).toArray();
    console.log('Samples:', JSON.stringify(allocatedSamples.map(s => ({ name: s.fullName, room: s.allocatedRoom, hostel: s.allocatedHostel })), null, 2));
    
    process.exit(0);
});
