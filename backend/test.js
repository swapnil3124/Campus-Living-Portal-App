const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/campus_portal').then(async () => {
    const docs = await mongoose.connection.collection('admissions').find({}).toArray();
    for (const doc of docs) {
        console.log(`FullName: ${doc.fullName}, Email: "${doc.email}", Passport: ${doc.studentPassword}`);
    }
    process.exit(0);
});
