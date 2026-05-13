import { generateQRCode, validateSession } from '../services/qrService.js';
import { consistentHashJS, sha256 } from '../utils/hash.js';
import { env } from '../config/env.js';

export const generateQR = async (req, res) => {
    try {
        const qrData = await generateQRCode(req.ip);
        res.json({ status: "success", ...qrData });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Failed to generate QR code" });
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

        res.redirect(`/index.html?sessionId=${data.sessionId}`);
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
