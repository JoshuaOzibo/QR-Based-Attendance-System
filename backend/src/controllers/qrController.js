import { generateQRCode, validateSession, activeSessions, deleteQRCodeFromCloudinary, endDbSession } from '../services/qrService.js';
import { consistentHashJS, sha256 } from '../utils/hash.js';
import { env } from '../config/env.js';

export const generateQR = async (req, res) => {
    try {
        const { courseTitle, hall, lecturerName, date, startTime, endTime } = req.body;
        
        // Parse date and endTime to create exact Unix timestamp
        const expiryDate = new Date(`${date}T${endTime}`);
        let expiresAt = expiryDate.getTime();
        
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

export const getActiveSession = (req, res) => {
    const userId = req.user.userId;
    for (const [sessionId, session] of activeSessions.entries()) {
        if (session.lecturerId === userId && session.expiresAt > Date.now()) {
            return res.json({ status: "success", hasSession: true, session: { sessionId, ...session } });
        }
    }
    return res.json({ status: "success", hasSession: false });
};

export const endSession = async (req, res) => {
    const userId = req.user.userId;
    for (const [sessionId, session] of activeSessions.entries()) {
        if (session.lecturerId === userId) {
            await deleteQRCodeFromCloudinary(sessionId);
            await endDbSession(sessionId);
            activeSessions.delete(sessionId);
            return res.json({ status: "success", message: "Session ended" });
        }
    }
    return res.json({ status: "success", message: "No active session found" });
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
