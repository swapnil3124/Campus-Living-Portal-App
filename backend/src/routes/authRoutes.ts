import { Router } from 'express';
import { staffLogin } from '../controllers/authController';

const router = Router();

// /api/auth/staff-login
router.post('/staff-login', staffLogin);

export default router;
