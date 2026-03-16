const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/campus_portal').then(async () => {
    const rooms = await mongoose.connection.db.collection('rooms').aggregate([
        { $group: { _id: '$hostelName', count: { $sum: 1 } } }
    ]).toArray();
    console.log(JSON.stringify(rooms, null, 2));
    
    const admissions = await mongoose.connection.db.collection('admissions').aggregate([
        { $group: { _id: '$allocatedHostel', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Admissions:', JSON.stringify(admissions, null, 2));
    
    process.exit(0);
});
