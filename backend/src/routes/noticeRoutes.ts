import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createNotice, getHostelNotices, updateNotice, deleteNotice, getPublicNotices } from '../controllers/noticeController';

const router = Router();

// Multer configuration for file uploads
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
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// /api/notices
router.get('/public', getPublicNotices);
router.post('/', upload.single('file'), createNotice);
router.get('/', getHostelNotices);
router.patch('/:noticeId', updateNotice);
router.delete('/:noticeId', deleteNotice);

export default router;
