import { Router } from 'express';
import { login, getMe, register, updateProfile } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.put('/update', verifyToken, updateProfile);

export default router;
