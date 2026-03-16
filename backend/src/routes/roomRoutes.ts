import express from 'express';
import { getRooms, bookBed, unbookBed, getRoommates } from '../controllers/roomController';
import { submitAssetDetails, getAssetDetails } from '../controllers/assetController';
import { authenticateStaff } from '../middleware/authMiddleware';

const router = express.Router();

// getRooms is used by wardens and students to see occupancy
router.get('/', getRooms);

// bookBed is used by students, we might need a separate studentAuth middleware or leave it for now
// For now, let's only protect the ones wardens use.
router.post('/book', bookBed);
router.post('/unbook', authenticateStaff, unbookBed);
router.get('/roommates', getRoommates);

// Assets are used by both students (submit) and wardens (view)
router.get('/assets', getAssetDetails);
router.post('/assets', submitAssetDetails);

export default router;
