import express from 'express';
import { scanOutgoing, scanIncoming, getLeaveLogs } from '../controllers/leaveEntryController';

const router = express.Router();

router.post('/scan-outgoing', scanOutgoing);
router.post('/scan-incoming', scanIncoming);
router.get('/logs', getLeaveLogs);

export default router;
