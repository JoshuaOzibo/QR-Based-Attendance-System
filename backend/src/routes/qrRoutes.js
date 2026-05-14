import { Router } from 'express';
import { generateQR, validateQRSession, consistentHash } from '../controllers/qrController.js';
import { qrLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Mounted at /api
router.post('/generate-qr', qrLimiter, generateQR);
router.post('/validate-session', validateQRSession);
router.post('/consistent-hash', consistentHash);

export default router;
