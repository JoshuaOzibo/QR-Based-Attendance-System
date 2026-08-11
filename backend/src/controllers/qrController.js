import { generateQRCode, validateSession, activeSessions, deleteQRCodeFromCloudinary, endDbSession } from '../services/qrService.js';
import { consistentHashJS, sha256 } from '../utils/hash.js';
import { env } from '../config/env.js';

import ClassSession from '../models/ClassSession.js';

export const generateQR = async (req, res) => {
    try {
        const { courseTitle, hall, lecturerName, date, startTime, endTime } = req.body;
        
        let startMs = new Date(`${date}T${startTime}`).getTime();
        let expiryDate = new Date(`${date}T${endTime}`);
        let expiresAt = expiryDate.getTime();
        
        // Handle overnight sessions: if end time is before or equal to start time, add 1 day to expiresAt
        if (!isNaN(startMs) && !isNaN(expiresAt) && expiresAt <= startMs) {
            expiresAt += 24 * 60 * 60 * 1000;
        }

        if (isNaN(expiresAt) || expiresAt <= Date.now()) {
            return res.status(400).json({ status: "error", message: "End time must be in the future." });
        }

        const sessionMetadata = { courseTitle, hall, lecturerName, date, startTime, endTime, lecturerId: req.user.userId };
        const qrData = await generateQRCode(req.ip, sessionMetadata, expiresAt);
        res.json({ status: "success", ...qrData });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to generate QR code" });
    }
};

export const getActiveSession = async (req, res) => {
    try {
        const userId = String(req.user.userId);
        const now = Date.now();

        // 1. Check in-memory map
        for (const [sessionId, session] of activeSessions.entries()) {
            if (String(session.lecturerId) === userId && session.expiresAt > now) {
                return res.json({ status: "success", hasSession: true, session: { sessionId, ...session } });
            }
        }

        // 2. Fallback check in MongoDB in case memory map was cleared or lost
        const dbSession = await ClassSession.findOne({
            lecturerId: userId,
            status: 'active',
            expiresAt: { $gt: now }
        }).sort({ createdAt: -1 });

        if (dbSession) {
            activeSessions.set(dbSession.sessionId, {
                ip: 'rehydrated',
                expiresAt: dbSession.expiresAt,
                cloudinaryPublicId: dbSession.cloudinaryPublicId,
                qrImage: dbSession.qrImageUrl,
                courseTitle: dbSession.courseTitle,
                hall: dbSession.hall,
                lecturerName: dbSession.lecturerName,
                date: dbSession.date,
                startTime: dbSession.startTime,
                endTime: dbSession.endTime,
                lecturerId: dbSession.lecturerId.toString()
            });

            return res.json({
                status: "success",
                hasSession: true,
                session: {
                    sessionId: dbSession.sessionId,
                    qrImage: dbSession.qrImageUrl,
                    expiresAt: dbSession.expiresAt,
                    courseTitle: dbSession.courseTitle,
                    hall: dbSession.hall,
                    lecturerName: dbSession.lecturerName,
                    date: dbSession.date,
                    startTime: dbSession.startTime,
                    endTime: dbSession.endTime,
                    lecturerId: dbSession.lecturerId.toString()
                }
            });
        }

        return res.json({ status: "success", hasSession: false });
    } catch (error) {
        console.error("Error fetching active session:", error);
        return res.status(500).json({ status: "error", message: "Failed to fetch active session" });
    }
};

export const endSession = async (req, res) => {
    try {
        const userId = String(req.user.userId);
        let endedCount = 0;

        // 1. Clear matching sessions from memory map
        for (const [sessionId, session] of activeSessions.entries()) {
            if (String(session.lecturerId) === userId) {
                await deleteQRCodeFromCloudinary(sessionId);
                await endDbSession(sessionId);
                activeSessions.delete(sessionId);
                endedCount++;
            }
        }

        // 2. Clear any active session for this lecturer in MongoDB
        const dbActiveSessions = await ClassSession.find({ lecturerId: userId, status: 'active' });
        for (const dbSess of dbActiveSessions) {
            await deleteQRCodeFromCloudinary(dbSess.sessionId);
            await endDbSession(dbSess.sessionId);
            activeSessions.delete(dbSess.sessionId);
            endedCount++;
        }

        return res.json({ status: "success", message: endedCount > 0 ? "Session ended successfully" : "No active session found" });
    } catch (error) {
        console.error("Error ending session:", error);
        return res.status(500).json({ status: "error", message: "Failed to end session" });
    }
};

export const validateQRSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) return res.status(400).json({ valid: false, message: "Session ID required" });
        const isValid = validateSession(sessionId);
        res.json({ valid: isValid, message: isValid ? "Valid session" : "Invalid or expired session ID" });
    } catch (error) {
        res.status(500).json({ valid: false, message: "Validation error" });
    }
};

export const verifyAttendanceRedirect = (req, res) => {
    try {
        const dataStr = decodeURIComponent(req.query.data);
        const data = JSON.parse(dataStr);

        if (!data?.sessionId || !data?.timestamp || !data?.hash) {
            return res.status(400).send('Invalid QR code data: Missing fields');
        }

        const expectedHash = sha256(data.sessionId + data.timestamp + env.QR_SECRET_KEY);

        if (data.hash !== expectedHash) {
            return res.status(400).send('Invalid QR code: Hash mismatch');
        }

        const qrExpiryTime = 15 * 60 * 1000;
        if (Date.now() - data.timestamp > qrExpiryTime) {
            return res.status(400).send('QR code expired');
        }

        const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/submit?sessionId=${data.sessionId}`);
    } catch (error) {
        res.status(400).send('Invalid QR code data');
    }
};

export const consistentHash = (req, res) => {
    const { input } = req.body;
    if (typeof input !== 'string' || !input.trim()) {
        return res.status(400).json({ error: 'Input must be a non-empty string' });
    }
    res.json({ fingerprint: consistentHashJS(input) });
};
