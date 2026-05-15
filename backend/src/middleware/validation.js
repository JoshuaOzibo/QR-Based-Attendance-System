export function validateAttendance(req, res, next) {
    const required = ['name', 'universityRollNo', 'deviceFingerprint'];
    const missing = required.filter(field => !req.body[field]);
  
    if (missing.length) {
      return res.status(400).json({
        status: "error",
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }
  
    if (!req.body.location || typeof req.body.location.lat !== "number" || typeof req.body.location.lng !== "number") {
      return res.status(400).json({
        status: "error",
        message: "Location (lat, lng) is required and must be numeric"
      });
    }
    next();
}
