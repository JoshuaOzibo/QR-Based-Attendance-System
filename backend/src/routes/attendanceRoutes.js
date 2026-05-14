import { Router } from 'express';
import { getAttendanceDates, getAttendanceByDate, streamLiveAttendance, getAttendanceStats } from '../controllers/attendanceController.js';
import { getStudentAttendanceRecords } from '../controllers/studentController.js';

const router = Router();

// Mounted at /api/attendance
router.get('/', getStudentAttendanceRecords);
router.get('/dates', getAttendanceDates);
router.get('/live', streamLiveAttendance);
router.get('/by-date', getAttendanceByDate);
router.get('/stats', getAttendanceStats);

export default router;
