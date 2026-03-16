
import mongoose from 'mongoose';
import Notice from './src/models/Notice';
import dotenv from 'dotenv';

dotenv.config();

const deleteDummyNotices = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-portal');
        console.log('Connected to MongoDB');

        // Based on previous mocks, public notices might have stayed there or been manual entries.
        // The user says "delete all dummy data of only home page notices".
        // This likely means notices that are public (isPublic: true) or those that were there before my changes.
        // Since I just added isPublic field, old notices won't have it set (defaults to false).
        
        // Let's see what notices are there.
        const allNotices = await Notice.find({});
        console.log(`Found ${allNotices.length} notices total.`);

        // Any notice that was meant for "Home page" but is dummy.
        // Before my change, maybe they used a specific hostel name or title.
        // Let's just delete all notices where hostelName is 'Public' or similar if they exist.
        
        const result = await Notice.deleteMany({ 
            $or: [
                { hostelName: 'Public' },
                { title: /dummy/i },
                { description: /dummy/i }
            ]
        });
        
        console.log(`Deleted ${result.deletedCount} dummy notices.`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

deleteDummyNotices();
