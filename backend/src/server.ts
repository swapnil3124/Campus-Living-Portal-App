import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import admissionRoutes from './routes/admissionRoutes';
import configRoutes from './routes/configRoutes';
import meritRoutes from './routes/meritRoutes';
import authRoutes from './routes/authRoutes';
import announcementRoutes from './routes/announcementRoutes';
import { initializeStaff } from './controllers/authController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Simple logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/admissions', admissionRoutes);
app.use('/api/config', configRoutes);
app.use('/api/merit', meritRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_portal';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        await initializeStaff();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });
