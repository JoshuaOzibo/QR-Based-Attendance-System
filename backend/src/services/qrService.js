import QRCode from 'qrcode';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

// Configure Cloudinary
// It expects the process.env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const QR_CODE_VALIDITY = 1.5 * 60 * 1000; // 1.5 minutes in ms
const CACHE_TIME = 90000;

export const activeSessions = new Map();
const ipCache = new Map();

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
        
        // Generate base64 data URL
        const dataUrl = await QRCode.toDataURL(qrData, {
            color: { dark: '#000000', light: '#ffffff' },
            width: 400,
            margin: 2
        });

        // Upload to Cloudinary
        let qrImageUrl = '';
        const hasValidKey = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_api_key';
        
        if (hasValidKey) {
            const uploadResponse = await cloudinary.uploader.upload(dataUrl, {
                folder: 'sentinel_qrcodes',
                public_id: `qr_${timestamp}`,
                overwrite: true
            });
            qrImageUrl = uploadResponse.secure_url;
        } else {
            console.warn("Cloudinary is not configured. Falling back to inline data URL.");
            qrImageUrl = dataUrl;
        }

        activeSessions.set(sessionId, {
            ip: ipAddress,
            expiresAt: timestamp + QR_CODE_VALIDITY,
            ...sessionMetadata
        });

        setTimeout(() => {
            activeSessions.delete(sessionId);
        }, QR_CODE_VALIDITY);

        const result = {
            qrImage: qrImageUrl,
            sessionId,
            expiresIn: QR_CODE_VALIDITY
        };

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
    const session = activeSessions.get(sessionId);
    if (!session) return false;
    
    if (Date.now() > session.expiresAt) {
        activeSessions.delete(sessionId);
        return false;
    }
    
    return true;
}

export function cleanupOldQRCodes() {
    // Legacy function. Cloudinary manages its own lifecycle or we can add delete calls later.
    // Kept here so app.js doesn't crash on setInterval.
}
