import { Router } from 'express';
import { createLeave, getStudentLeaves, getWardenLeaves, updateLeaveStatus } from '../controllers/leaveController';
import { authenticateStaff } from '../middleware/authMiddleware';

const router = Router();

router.post('/', createLeave);
router.get('/student/:studentId', getStudentLeaves);
router.get('/warden', authenticateStaff, getWardenLeaves); // Add ?hostelName=...
router.patch('/:leaveId/status', authenticateStaff, updateLeaveStatus);

export default router;
