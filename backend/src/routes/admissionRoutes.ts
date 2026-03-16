import { Router } from 'express';
import {
    getAllAdmissions,
    getAdmissionById,
    createAdmission,
    updateAdmission,
    deleteAdmission,
} from '../controllers/admissionController';
import { authenticateStaff } from '../middleware/authMiddleware';

const router = Router();

// Public routes (if any, but usually creation is from students)
// If students create admissions without login, we keep POST public.
// However, the request says "warden can see only there hostels students registration forms",
// which refers to the GET and management routes.

router.get('/', authenticateStaff, getAllAdmissions);
router.get('/:id', authenticateStaff, getAdmissionById);
router.post('/', createAdmission); // Keep public for student submissions
router.put('/:id', authenticateStaff, updateAdmission);
router.delete('/:id', authenticateStaff, deleteAdmission);

export default router;
