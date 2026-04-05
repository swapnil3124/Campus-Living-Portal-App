import express from 'express';
import {
    generateMeritList,
    getMeritLists,
    getMeritListById,
    deleteMeritList,
    publishMeritList,
    sendToRector,
    generateAndSendPasswords,
    exportMeritList,
    exportHostelWiseMeritList,
    dispatchEmails
} from '../controllers/meritController';

import { authenticateStaff } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes - no auth needed (Excel download from announcement)
router.get('/hostel/export', exportHostelWiseMeritList);
router.get('/hostel/export/:filename', exportHostelWiseMeritList); // Enhanced route with filename
router.get('/:id/export', exportMeritList);
router.get('/:id/export/:filename', exportMeritList); // Enhanced route with filename

// All routes below require authentication
router.use(authenticateStaff);

router.get('/', getMeritLists);
router.get('/:id', getMeritListById);
router.post('/generate', generateMeritList);
router.post('/send-emails', dispatchEmails);
router.post('/:id/publish', publishMeritList);
router.post('/:id/send-to-rector', sendToRector);
router.post('/:id/generate-passwords', generateAndSendPasswords);
router.delete('/:id', deleteMeritList);

export default router;
