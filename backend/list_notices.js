
const mongoose = require('mongoose');

const listNotices = async () => {
    try {
        const uri = 'mongodb://localhost:27017/campus-portal';
        await mongoose.connect(uri);
        const notices = await mongoose.connection.db.collection('notices').find({}).toArray();
        console.log(JSON.stringify(notices, null, 2));
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

listNotices();
