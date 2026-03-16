import mongoose from "mongoose";
import dotenv from "dotenv";
import MessMenu from "./src/models/MessMenu";
import MessAttendance from "./src/models/MessAttendance";
import MessFeedback from "./src/models/MessFeedback";

dotenv.config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_portal');
        console.log("Connected to MongoDB for cleanup...");

        const menuCount = await MessMenu.deleteMany({});
        const attendanceCount = await MessAttendance.deleteMany({});
        const feedbackCount = await MessFeedback.deleteMany({});

        console.log(`🧹 Cleanup Complete!`);
        console.log(`- Deleted ${menuCount.deletedCount} mess menus`);
        console.log(`- Deleted ${attendanceCount.deletedCount} attendance records`);
        console.log(`- Deleted ${feedbackCount.deletedCount} feedback records`);

    } catch (err) {
        console.error("Cleanup Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
};

cleanup();
