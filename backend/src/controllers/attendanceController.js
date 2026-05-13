import { AttendanceService } from '../services/attendanceService.js';

export const markAttendance = async (req, res) => {
    try {
        const result = await AttendanceService.markAttendance(req.body);
        res.json({ status: "success", message: "Attendance marked successfully", data: result });
    } catch (error) {
        console.error("Attendance error:", error);
        res.status(400).json({ status: "error", message: error.message });
    }
};

export const getAttendanceDates = async (req, res) => {
    try {
        const dates = await AttendanceService.getAttendanceDates();
        res.json({ status: "success", data: dates });
    } catch (error) {
        console.error("Error fetching attendance dates:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

export const getAttendanceByDate = async (req, res) => {
    try {
        const attendance = await AttendanceService.getAttendanceByDate(req.query.date);
        res.json({ status: "success", data: attendance });
    } catch (error) {
        console.error("Error fetching attendance by date:", error);
        res.status(error.message.includes('required') ? 400 : 500).json({ status: "error", message: error.message });
    }
};
