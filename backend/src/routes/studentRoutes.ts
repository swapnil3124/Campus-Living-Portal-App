import { Router } from 'express';
import { studentLogin, getStudentProfile } from '../controllers/studentController';

const router = Router();

// /api/students/login
router.post('/login', studentLogin);

// /api/students/profile
router.get('/profile', getStudentProfile);

export default router;
