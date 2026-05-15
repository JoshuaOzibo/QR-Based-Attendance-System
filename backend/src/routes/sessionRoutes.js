import express from 'express';
import { getLecturerSessions, getSessionAttendance, deleteSession } from '../controllers/sessionController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken);
router.use(requireRole(['LECTURER', 'ADMIN']));

router.get('/', getLecturerSessions);
router.get('/:sessionId/attendance', getSessionAttendance);
router.delete('/:sessionId', deleteSession);

export default router;
