import { Router } from 'express';
import { getAttendanceDates, getAttendanceByDate, streamLiveAttendance, getAttendanceStats, markAttendance } from '../controllers/attendanceController.js';
import { getStudentAttendanceRecords } from '../controllers/studentController.js';
import { validateAttendance } from '../middleware/validation.js';

const router = Router();

// Mounted at /api/attendance
router.get('/', getStudentAttendanceRecords);
router.get('/dates', getAttendanceDates);
router.get('/live', streamLiveAttendance);
router.get('/by-date', getAttendanceByDate);
router.get('/stats', getAttendanceStats);
router.post('/mark', validateAttendance, markAttendance);

export default router;
