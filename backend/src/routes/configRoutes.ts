import express from 'express';
import { getConfig, setConfig, getAllConfigs } from '../controllers/configController';

const router = express.Router();

router.get('/', getAllConfigs);
router.get('/:key', getConfig);
router.post('/', setConfig);

export default router;
