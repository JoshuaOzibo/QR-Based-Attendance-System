import { Router } from 'express';
import { getAttendanceDates, getAttendanceByDate } from '../controllers/attendanceController.js';
import { getStudentAttendanceRecords } from '../controllers/studentController.js';

const router = Router();

// Mounted at /api/attendance
router.get('/', getStudentAttendanceRecords);
router.get('/dates', getAttendanceDates);
router.get('/by-date', getAttendanceByDate);

export default router;
