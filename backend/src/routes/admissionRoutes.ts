import { Router } from 'express';
import {
    getAllAdmissions,
    getAdmissionById,
    createAdmission,
    updateAdmission,
    deleteAdmission,
} from '../controllers/admissionController';

const router = Router();

router.get('/', getAllAdmissions);
router.get('/:id', getAdmissionById);
router.post('/', createAdmission);
router.put('/:id', updateAdmission);
router.delete('/:id', deleteAdmission);

export default router;
