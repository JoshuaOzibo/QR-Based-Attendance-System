import ClassSession from '../models/ClassSession.js';
import Attendance from '../models/Attendance.js';
import { v2 as cloudinary } from 'cloudinary';
import { activeSessions } from '../services/qrService.js';

export const getLecturerSessions = async (req, res) => {
    try {
        const lecturerId = req.user.userId;
        const sessions = await ClassSession.find({ lecturerId }).sort({ createdAt: -1 });
        res.json({ status: "success", data: sessions });
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch sessions" });
    }
};

export const getSessionAttendance = async (req, res) => {
    try {
        const { sessionId } = req.params;
        // Verify lecturer owns the session
        const session = await ClassSession.findOne({ sessionId, lecturerId: req.user.userId });
        if (!session) {
             return res.status(404).json({ status: "error", message: "Session not found" });
        }

        const attendance = await Attendance.find({ sessionId }).sort({ createdAt: -1 });
        res.json({ status: "success", data: attendance });
    } catch (error) {
        console.error("Failed to fetch attendance:", error);
        res.status(500).json({ status: "error", message: "Failed to fetch attendance" });
    }
};

export const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await ClassSession.findOne({ sessionId, lecturerId: req.user.userId });
        if (!session) {
            return res.status(404).json({ status: "error", message: "Session not found" });
        }

        // Delete from in-memory activeSessions map
        activeSessions.delete(sessionId);

        // Delete from cloudinary if it exists
        if (session.cloudinaryPublicId) {
            const hasValidKey = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_api_key';
            if (hasValidKey) {
                try {
                    await cloudinary.uploader.destroy(session.cloudinaryPublicId);
                } catch (err) {
                    console.error('Failed to delete QR code from Cloudinary:', err);
                }
            }
        }

        await ClassSession.deleteOne({ _id: session._id });
        await Attendance.deleteMany({ sessionId });

        res.json({ status: "success", message: "Session deleted successfully" });
    } catch (error) {
        console.error("Failed to delete session:", error);
        res.status(500).json({ status: "error", message: "Failed to delete session" });
    }
};
