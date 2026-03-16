import express from 'express';
import multer from 'multer';
import path from 'path';
import * as messController from '../controllers/messController';

const router = express.Router();

// Multer config for Mess (Menu and QR)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Menu routes
router.get('/menu', messController.getMessMenu);
router.post('/menu/update', upload.fields([
    { name: 'menuFile', maxCount: 1 },
    { name: 'paymentQr', maxCount: 1 }
]), messController.updateMessMenu);

// Stats & Feedback routes
router.get('/stats', messController.getMessStats);
router.post('/feedback/submit', messController.submitFeedback);

export default router;
