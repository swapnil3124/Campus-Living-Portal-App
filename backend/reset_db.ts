import mongoose from "mongoose";
import dotenv from "dotenv";
import MeritList from "./src/models/MeritList";
import { Announcement } from "./src/models/Announcement";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected to MongoDB");

        // Delete all Merit List Published announcements for Shivneri, Lenyadri, Bhimashankar
        const deleted = await Announcement.deleteMany({
            message: { $regex: /Merit List Published/i }
        });
        console.log(`Deleted ${deleted.deletedCount} announcements.`);

        // Revert all published MeritLists back to sent_to_rector
        const updated = await MeritList.updateMany(
            { status: "published" },
            { $set: { status: "sent_to_rector" } }
        );
        console.log(`Reverted ${updated.modifiedCount} merit lists back to sent_to_rector.`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
};

run();
