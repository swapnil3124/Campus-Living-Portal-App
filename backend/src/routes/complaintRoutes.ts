import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
    createComplaint, 
    getStudentComplaints, 
    getWardenComplaints, 
    updateComplaintStatus 
} from '../controllers/complaintController';
import { authenticateStaff } from '../middleware/authMiddleware';

const router = express.Router();

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

router.post('/', upload.single('image'), createComplaint);
router.get('/student/:studentId', getStudentComplaints);
router.get('/warden', authenticateStaff, getWardenComplaints);
router.patch('/:complaintId', authenticateStaff, updateComplaintStatus);

export default router;
