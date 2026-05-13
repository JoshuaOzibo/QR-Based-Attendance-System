import { AttendanceService, attendanceEmitter } from '../services/attendanceService.js';

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

export const streamLiveAttendance = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const listener = (newRecord) => {
        res.write(`data: ${JSON.stringify(newRecord)}\n\n`);
    };

    attendanceEmitter.on('new_attendance', listener);

    req.on('close', () => {
        attendanceEmitter.off('new_attendance', listener);
    });
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
