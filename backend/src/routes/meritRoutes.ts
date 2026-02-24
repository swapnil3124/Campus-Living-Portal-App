import express from 'express';
import {
    generateMeritList,
    getMeritLists,
    getMeritListById,
    deleteMeritList,
    publishMeritList
} from '../controllers/meritController';

const router = express.Router();

router.get('/', getMeritLists);
router.get('/:id', getMeritListById);
router.post('/generate', generateMeritList);
router.post('/:id/publish', publishMeritList);
router.delete('/:id', deleteMeritList);

export default router;
