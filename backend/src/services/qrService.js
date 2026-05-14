import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QR_CODE_VALIDITY = 1.5 * 60 * 1000; // 1.5 minutes in ms
const QR_CODE_DIR = env.QR_CODE_DIR || path.join(__dirname, '../../frontend/public/qrcodes');
const CACHE_TIME = 90000;

// TODO: For production scale with multiple Node instances, 
// replace these in-memory Maps with a Redis datastore.
// Example: redisClient.set(sessionId, data, 'EX', 90)
export const activeSessions = new Map();
const ipCache = new Map();

if (!fs.existsSync(QR_CODE_DIR)) {
    fs.mkdirSync(QR_CODE_DIR, { recursive: true });
}

export async function generateQRCode(ipAddress, sessionMetadata = {}) {
    if (ipCache.has(ipAddress)) {
        const cached = ipCache.get(ipAddress);
        if (Date.now() - cached.timestamp < CACHE_TIME) {
            return cached.data;
        }
    }

    try {
        const sessionId = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        
        const secretKey = env.QR_SECRET_KEY;
        const hash = crypto.createHash('sha256')
                         .update(sessionId + timestamp + secretKey)
                         .digest('hex');

        const qrData = `http://localhost:5000/verify-attendance?data=${encodeURIComponent(JSON.stringify({
            sessionId,
            timestamp,
            hash
        }))}`;
        const fileName = `qr_${timestamp}.png`;
        const filePath = path.join(QR_CODE_DIR, fileName);

        await QRCode.toFile(filePath, qrData, {
            color: { dark: '#000000', light: '#ffffff' },
            width: 400,
            margin: 2
        });

        // TODO: Replace with Redis Set operation
        activeSessions.set(sessionId, {
            ip: ipAddress,
            expiresAt: timestamp + QR_CODE_VALIDITY,
            ...sessionMetadata
        });

        setTimeout(() => {
            // TODO: Redis keys can auto-expire, removing need for setTimeout
            activeSessions.delete(sessionId);
        }, QR_CODE_VALIDITY);

        const result = {
            qrImage: `/qrcodes/${fileName}`,
            sessionId,
            expiresIn: QR_CODE_VALIDITY
        };

        // TODO: Replace with Redis Set operation
        ipCache.set(ipAddress, {
            data: result,
            timestamp: Date.now()
        });

        return result;
    } catch (error) {
        console.error('QR generation error:', error);
        throw error;
    }
}

export function validateSession(sessionId) {
    // TODO: Replace with Redis Get operation
    const session = activeSessions.get(sessionId);
    if (!session) return false;
    
    if (Date.now() > session.expiresAt) {
        activeSessions.delete(sessionId);
        return false;
    }
    
    return true;
}

export function cleanupOldQRCodes() {
    const now = Date.now();
    fs.readdir(QR_CODE_DIR, (err, files) => {
        if (err) {
            console.error('Cleanup error:', err);
            return;
        }
        files.forEach(file => {
            if (file.startsWith('qr_') && file.endsWith('.png')) {
                const fileTimestamp = parseInt(file.split('_')[1].split('.')[0]);
                if (isNaN(fileTimestamp)) return;
                if (now - fileTimestamp > QR_CODE_VALIDITY) {
                    fs.unlink(path.join(QR_CODE_DIR, file), err => {
                        if (err) console.error('Error deleting file:', file, err);
                    });
                }
            }
        });
    });
}
