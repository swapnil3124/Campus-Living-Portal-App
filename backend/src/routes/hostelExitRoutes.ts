import express from 'express';
import { submitExitRequest, getStudentExitRequests, getWardenExitRequests, updateExitRequestStatus } from '../controllers/hostelExitController';

const router = express.Router();

router.post('/', submitExitRequest);
router.get('/student', getStudentExitRequests);
router.get('/warden', getWardenExitRequests);
router.put('/:id/status', updateExitRequestStatus);

export default router;
