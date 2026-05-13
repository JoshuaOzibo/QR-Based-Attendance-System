import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { cleanupOldQRCodes } from './services/qrService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security & Parsing Middleware
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "script-src": ["'self'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
            "style-src": ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            "img-src": ["'self'", "data:", "https://ui-avatars.com"]
        }
    }
}));
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Static files (Frontend and QR Codes)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/qrcodes', express.static(env.QR_CODE_DIR || path.join(__dirname, '../../frontend/public/qrcodes'), {
    maxAge: '1h',
    setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin')
}));

// API Routes
app.use(routes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

// SPA Fallback (Express 5 compatible)
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        const indexPath = path.join(__dirname, '../../frontend/dist/index.html');
        return res.sendFile(indexPath, (err) => {
            if (err) next(); // Fallthrough to 404 handler
        });
    }
    next();
});

// Error Handling Middleware
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start QR Cleanup Job
setInterval(cleanupOldQRCodes, 5 * 60 * 1000);
cleanupOldQRCodes();

export default app;
