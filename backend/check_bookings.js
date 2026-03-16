const mongoose = require('mongoose');
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_portal';

mongoose.connect(mongoUrl).then(async () => {
    const rooms = await mongoose.connection.db.collection('rooms').find({ 'beds.isBooked': true }).toArray();
    console.log(`Total rooms with bookings: ${rooms.length}`);
    rooms.forEach(r => {
        const count = r.beds.filter(b => b.isBooked).length;
        console.log(`${r.hostelName} | Room ${r.roomNumber} | ${count} occupants`);
        r.beds.filter(b => b.isBooked).forEach(b => console.log(`  - ${b.studentName}`));
    });
    process.exit(0);
});
