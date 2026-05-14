import { Router } from 'express';
import { generateQR, validateQRSession, consistentHash, getActiveSession, endSession } from '../controllers/qrController.js';
import { qrLimiter } from '../middleware/rateLimiter.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Mounted at /api
router.post('/generate-qr', verifyToken, qrLimiter, generateQR);
router.get('/active-session', verifyToken, getActiveSession);
router.delete('/end-session', verifyToken, endSession);
router.post('/validate-session', validateQRSession);
router.post('/consistent-hash', consistentHash);

export default router;
