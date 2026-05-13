import { env } from '../config/env.js';

export function notFoundHandler(req, res) {
    res.status(404).json({ status: "error", message: "Route not found" });
}

export function globalErrorHandler(err, req, res, next) {
    console.error("Server error:", {
        message: err.message,
        stack: env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method
    });
    res.status(500).json({ status: "error", message: "Internal server error" });
}
