const mongoose = require('mongoose');
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_portal';

mongoose.connect(mongoUrl).then(async () => {
    console.log("--- Diagnostics Start ---");
    
    // 1. Check all students who have a room
    const allocatedStudents = await mongoose.connection.db.collection('admissions').find({ isRoomAllocated: true }).toArray();
    console.log(`Total allocated students found: ${allocatedStudents.length}`);
    
    allocatedStudents.forEach(s => {
        console.log(`Student: ${s.fullName}, Hostel: "${s.allocatedHostel}", Room: "${s.allocatedRoom}", Bed: ${s.allocatedBed} (${typeof s.allocatedBed})`);
    });

    // 2. Check rooms that have booked beds
    const bookedRooms = await mongoose.connection.db.collection('rooms').find({ "beds.isBooked": true }).toArray();
    console.log(`Total rooms with bookings in DB: ${bookedRooms.length}`);
    
    bookedRooms.forEach(r => {
        const bookedBeds = r.beds.filter(b => b.isBooked);
        console.log(`Room: "${r.roomNumber}", Hostel: "${r.hostelName}", Floor: ${r.floor}, Booked Beds: ${bookedBeds.length}`);
        bookedBeds.forEach(b => {
             console.log(`  - Bed ${b.bedNumber}: ${b.studentName}`);
        });
    });

    // 3. Check for Lenyadri specifically
    const lenyadriRooms = await mongoose.connection.db.collection('rooms').find({ hostelName: "Lenyadri Hostel" }).toArray();
    console.log(`\nLenyadri Hostel Room Count: ${lenyadriRooms.length}`);
    
    process.exit(0);
}).catch(err => {
    console.error("Connection failed", err);
    process.exit(1);
});
