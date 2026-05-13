import { StudentService } from '../services/studentService.js';
import { AttendanceRepository } from '../repositories/attendanceRepository.js';

export const getStudentProfile = async (req, res) => {
    try {
        const student = await StudentService.getStudentProfile(req.query.rollNo);
        res.json({ data: student });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

export const getStudentsByAttendanceRange = async (req, res) => {
    try {
        const results = await StudentService.getStudentsByAttendanceRange(req.query.min, req.query.max);
        res.json({ status: "success", data: results });
    } catch (error) {
        res.status(400).json({ status: "error", message: error.message });
    }
};

export const getStudentAttendanceRecords = async (req, res) => {
    try {
        const { rollNo } = req.query; // From old attendance.js (GET /api/attendance?rollNo=...)
        if (!rollNo) return res.status(400).json({ message: "Roll number is required" });
        
        const student = await StudentService.getStudentProfile(rollNo);
        const attendance = await AttendanceRepository.getStudentAttendanceRecords(rollNo, '0000-00-00', '9999-12-31');

        res.json({
            status: "success",
            name: student.personalInfo?.fullName || "Unknown",
            universityRollNo: student.universityRollNo,
            attendance
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

export const getStudentAttendanceStats = async (req, res) => {
    try {
        const data = await StudentService.getStudentAttendance(req.params.rollNo, req.query.period);
        res.json({ status: "success", data });
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500).json({ status: "error", message: error.message });
    }
};

export const getStudentNotifications = async (req, res) => {
    const dummyNotifications = [
        { text: "Assignment deadline extended!", timestamp: new Date(), read: false },
        { text: "New grades posted.", timestamp: new Date(), read: true }
    ];
    res.json({ data: dummyNotifications });
};

export const markNotificationsRead = async (req, res) => {
    res.json({ status: 'success' });
};

export const getStudentDocuments = async (req, res) => {
    res.json({
        data: {
            idCardUrl: null, resumeUrl: null, feeReceipts: [], gradeSheets: []
        }
    });
};
