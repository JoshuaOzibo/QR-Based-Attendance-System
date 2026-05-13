import { Router } from 'express';
import { 
    getStudentProfile, 
    getStudentsByAttendanceRange, 
    getStudentAttendanceStats, 
    getStudentNotifications, 
    markNotificationsRead, 
    getStudentDocuments 
} from '../controllers/studentController.js';

const router = Router();

// Mounted at /api/students
router.get('/profile', getStudentProfile);
router.get('/by-attendance-range', getStudentsByAttendanceRange);
router.get('/notifications', getStudentNotifications);
router.post('/notifications/read', markNotificationsRead);
router.get('/:rollNo/attendance', getStudentAttendanceStats);
router.get('/:rollNo/documents', getStudentDocuments);

export default router;
