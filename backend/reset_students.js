const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_portal';

async function resetStudents() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;

        await db.collection('admissions').updateMany(
            {},
            { $unset: { isRoomAllocated: "", allocatedRoom: "", allocatedBed: "" } }
        );

        console.log('Successfully reset student allocations!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetStudents();
