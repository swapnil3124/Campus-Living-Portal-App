import express from 'express';
import {
    generateMeritList,
    getMeritLists,
    getMeritListById,
    deleteMeritList,
    publishMeritList,
    sendToRector,
    generateAndSendPasswords
} from '../controllers/meritController';

const router = express.Router();

router.get('/', getMeritLists);
router.get('/:id', getMeritListById);
router.post('/generate', generateMeritList);
router.post('/:id/publish', publishMeritList);
router.post('/:id/send-to-rector', sendToRector);
router.post('/:id/generate-passwords', generateAndSendPasswords);
router.delete('/:id', deleteMeritList);

export default router;
