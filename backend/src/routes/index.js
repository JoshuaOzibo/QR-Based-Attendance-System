import { Router } from 'express';
import studentRoutes from './studentRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import qrRoutes from './qrRoutes.js';
import algorithmRoutes from './algorithmRoutes.js';
import authRoutes from './authRoutes.js';
import { markAttendance } from '../controllers/attendanceController.js';
import { verifyAttendanceRedirect } from '../controllers/qrController.js';
import { validateAttendance } from '../middleware/validation.js';

const router = Router();

// Modular API Routes
router.use('/api/auth', authRoutes);
router.use('/api/students', studentRoutes);
router.use('/api/attendance', attendanceRoutes);
router.use('/api', qrRoutes);
router.use('/api', algorithmRoutes);

// Root/Global level routes (to maintain backward compatibility with old frontend URLs)
router.post('/mark-attendance', validateAttendance, markAttendance);
router.get('/verify-attendance', verifyAttendanceRedirect);

export default router;
