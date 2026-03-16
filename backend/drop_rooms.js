const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_portal';

async function dropRooms() {
    try {
        await mongoose.connect(MONGODB_URI);
        const db = mongoose.connection.db;

        // Also drop isRoomAllocated on admissions just to be safe if that exists, 
        // but the user only asked for room names. We'll simply drop the rooms.
        await db.collection('rooms').deleteMany({});

        // Also reset students so they can see it working? The user hasn't asked to reset students,
        // but without it they might not see anything. Let's just drop rooms as that regenerates them.
        console.log('Successfully deleted existing rooms so they can be regenerated with new names!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dropRooms();
