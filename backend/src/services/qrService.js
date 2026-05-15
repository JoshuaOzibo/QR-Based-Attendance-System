import QRCode from 'qrcode';
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import ClassSession from '../models/ClassSession.js';

// Configure Cloudinary
// It expects the process.env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const QR_CODE_VALIDITY = 1.5 * 60 * 1000; // 1.5 minutes in ms

export const activeSessions = new Map();

export async function generateQRCode(ipAddress, sessionMetadata = {}, expiresAt) {

    try {
        const sessionId = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        const expiration = expiresAt || (timestamp + QR_CODE_VALIDITY);
        
        const secretKey = env.QR_SECRET_KEY;
        const hash = crypto.createHash('sha256')
                         .update(sessionId + timestamp + secretKey)
                         .digest('hex');

        const qrData = `${process.env.BASE_URL}/verify-attendance?data=${encodeURIComponent(JSON.stringify({
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
            expiresAt: expiration,
            cloudinaryPublicId: hasValidKey ? `sentinel_qrcodes/qr_${timestamp}` : null,
            qrImage: qrImageUrl,
            ...sessionMetadata
        });

        const dbSession = new ClassSession({
            sessionId,
            courseTitle: sessionMetadata.courseTitle,
            hall: sessionMetadata.hall,
            date: sessionMetadata.date,
            startTime: sessionMetadata.startTime,
            endTime: sessionMetadata.endTime,
            lecturerId: sessionMetadata.lecturerId,
            lecturerName: sessionMetadata.lecturerName,
            qrImageUrl: qrImageUrl,
            cloudinaryPublicId: hasValidKey ? `sentinel_qrcodes/qr_${timestamp}` : null,
            expiresAt: expiration,
            status: 'active'
        });
        await dbSession.save();

        setTimeout(() => {
            if (activeSessions.has(sessionId)) {
                deleteQRCodeFromCloudinary(sessionId).catch(console.error);
                endDbSession(sessionId).catch(console.error);
                activeSessions.delete(sessionId);
            }
        }, expiration - timestamp);

        const result = {
            qrImage: qrImageUrl,
            sessionId,
            expiresIn: expiration - timestamp,
            expiresAt: expiration
        };

        return result;
    } catch (error) {
        console.error('QR generation error:', error);
        throw error;
    }
}

export async function deleteQRCodeFromCloudinary(sessionId) {
    const session = activeSessions.get(sessionId);
    if (!session || !session.cloudinaryPublicId) return;

    const hasValidKey = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_api_key';
    if (hasValidKey) {
        try {
            await cloudinary.uploader.destroy(session.cloudinaryPublicId);
        } catch (error) {
            console.error('Failed to delete QR code from Cloudinary:', error);
        }
    }
}

export async function endDbSession(sessionId) {
    try {
        await ClassSession.findOneAndUpdate({ sessionId }, { status: 'ended' });
    } catch (err) {
        console.error("Failed to end DB session:", err);
    }
}

export function validateSession(sessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) return false;
    
    if (Date.now() > session.expiresAt) {
        deleteQRCodeFromCloudinary(sessionId).catch(console.error);
        endDbSession(sessionId).catch(console.error);
        activeSessions.delete(sessionId);
        return false;
    }
    
    return true;
}

export function cleanupOldQRCodes() {
    // Legacy function. Cloudinary manages its own lifecycle or we can add delete calls later.
    // Kept here so app.js doesn't crash on setInterval.
}

export async function rehydrateSessions() {
    try {
        const activeDbSessions = await ClassSession.find({ status: 'active' });
        const now = Date.now();
        
        for (const session of activeDbSessions) {
            if (session.expiresAt && now > session.expiresAt) {
                // Session expired while server was offline
                await deleteQRCodeFromCloudinaryStr(session.cloudinaryPublicId);
                await endDbSession(session.sessionId);
            } else if (session.expiresAt) {
                // Restore to memory map
                activeSessions.set(session.sessionId, {
                    ip: 'rehydrated', // We don't have the IP but we don't strictly need it
                    expiresAt: session.expiresAt,
                    cloudinaryPublicId: session.cloudinaryPublicId,
                    qrImage: session.qrImageUrl,
                    courseTitle: session.courseTitle,
                    hall: session.hall,
                    lecturerName: session.lecturerName,
                    date: session.date,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    lecturerId: session.lecturerId?.toString()
                });

                // Recreate the timeout
                setTimeout(() => {
                    if (activeSessions.has(session.sessionId)) {
                        deleteQRCodeFromCloudinary(session.sessionId).catch(console.error);
                        endDbSession(session.sessionId).catch(console.error);
                        activeSessions.delete(session.sessionId);
                    }
                }, session.expiresAt - now);
            }
        }
        console.log(`Rehydrated ${activeSessions.size} active sessions from DB.`);
    } catch (err) {
        console.error("Failed to rehydrate sessions:", err);
    }
}

async function deleteQRCodeFromCloudinaryStr(publicId) {
    if (!publicId) return;
    const hasValidKey = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_api_key';
    if (hasValidKey) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Failed to delete QR code from Cloudinary:', error);
        }
    }
}
