
const mongoose = require('mongoose');

const deleteDummyNotices = async () => {
    try {
        const uri = 'mongodb://localhost:27017/campus-portal'; // Common default, I should check if there is a config
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Delete notices that look like dummy data
        const result = await mongoose.connection.db.collection('notices').deleteMany({ 
            $or: [
                { hostelName: 'Public' },
                { title: { $regex: /dummy/i } },
                { description: { $regex: /dummy/i } }
            ]
        });
        
        console.log(`Deleted ${result.deletedCount} dummy notices.`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

deleteDummyNotices();
