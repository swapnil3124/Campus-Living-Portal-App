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

router.use(authenticateStaff);

router.get('/', getMeritLists);
router.get('/:id', getMeritListById);
router.get('/hostel/export', exportHostelWiseMeritList);
router.get('/:id/export', exportMeritList);
router.post('/generate', generateMeritList);
router.post('/send-emails', dispatchEmails);
router.post('/:id/publish', publishMeritList);
router.post('/:id/send-to-rector', sendToRector);
router.post('/:id/generate-passwords', generateAndSendPasswords);
router.delete('/:id', deleteMeritList);

export default router;
