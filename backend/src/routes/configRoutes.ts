import express from 'express';
import { getConfig, setConfig, getAllConfigs } from '../controllers/configController';

import { authenticateStaff } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', getAllConfigs);
router.get('/:key', getConfig);
router.post('/', authenticateStaff, setConfig);

export default router;
