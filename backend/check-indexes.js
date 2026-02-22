const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/campus_portal';

async function checkIndexes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('admissions');
        const indexes = await collection.indexes();
        console.log('Indexes for admissions collection:');
        console.log(JSON.stringify(indexes, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkIndexes();
