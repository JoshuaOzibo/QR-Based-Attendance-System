import { AttendanceService, attendanceEmitter } from '../services/attendanceService.js';
import User from '../models/User.js';
import { activeSessions } from '../services/qrService.js';
import { AttendanceRepository } from '../repositories/attendanceRepository.js';
import ClassSession from '../models/ClassSession.js';

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

export const streamLiveAttendance = async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Find the current active session at the time the SSE connection is opened
    const now = Date.now();
    const activeSession = await ClassSession.findOne({ status: 'active', expiresAt: { $gt: now } });
    const activeSessionId = activeSession?.sessionId || null;

    const listener = (newRecord) => {
        // Only broadcast records that belong to the currently active session
        if (!activeSessionId || newRecord.sessionId?.toString() !== activeSessionId) return;
        res.write(`data: ${JSON.stringify(newRecord)}\n\n`);
    };

    attendanceEmitter.on('new_attendance', listener);

    req.on('close', () => {
        attendanceEmitter.off('new_attendance', listener);
    });
};

export const getAttendanceByDate = async (req, res) => {
    try {
        const now = Date.now();
        // Find the single active session that hasn't expired
        const activeSession = await ClassSession.findOne({ status: 'active', expiresAt: { $gt: now } });
        if (!activeSession) {
            return res.json({ status: "success", data: [] });
        }
        // Only return attendance records belonging to THIS session
        const attendance = await AttendanceRepository.getAttendanceBySession(activeSession.sessionId);
        res.json({ status: "success", data: attendance });
    } catch (error) {
        console.error("Error fetching attendance by date:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};

export const getAttendanceStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'STUDENT' });
        
        const today = new Date().toISOString().split('T')[0];
        const now = Date.now();
        // Only count sessions that are truly active (status=active AND not yet expired)
        const activeSessionsCount = await ClassSession.countDocuments({ status: 'active', expiresAt: { $gt: now } });

        let presentToday = 0;
        let flaggedToday = 0;

        if (activeSessionsCount > 0) {
            // Find the specific active session to count only its attendees
            const activeSession = await ClassSession.findOne({ status: 'active', expiresAt: { $gt: now } });
            if (activeSession) {
                presentToday = await AttendanceRepository.countAttendanceBySession(activeSession.sessionId);
            }
            const today = new Date().toISOString().split('T')[0];
            flaggedToday = await AttendanceRepository.countFlaggedAttendance(today);
        }
        
        res.json({
            status: "success",
            data: {
                totalStudents,
                presentToday,
                activeSessions: activeSessionsCount,
                fraudPrevention: '99.98%',
                anomaliesBlocked: flaggedToday || 0
            }
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};
