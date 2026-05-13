# Backend API Reference

## Base URL
```
http://localhost:5000
```

---

## Authentication & Headers

All requests should include:
```json
{
  "Content-Type": "application/json"
}
```

---

## Core Endpoints

### 1. QR Code Generation

#### `GET /api/generate-qr`

Generate a new QR code for attendance marking.

**Query Parameters:**
```
ipAddress (optional): String - Client IP address
```

**Response (200 OK):**
```json
{
  "status": "success",
  "qrCodeUrl": "/qrcodes/qr_1715507400000.png",
  "sessionId": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "expiresIn": 90000,
  "message": "QR code generated successfully"
}
```

**Response (429 Too Many Requests):**
```json
{
  "status": "error",
  "message": "Too many QR requests. Please wait a minute."
}
```

**Curl Example:**
```bash
curl http://localhost:5000/api/generate-qr
```

---

### 2. Mark Attendance

#### `POST /mark-attendance`

Submit attendance for a student using QR code validation.

**Request Body:**
```json
{
  "name": "John Doe",
  "universityRollNo": "2024001",
  "section": "A",
  "classRollNo": "001",
  "location": {
    "lat": 30.2679634,
    "lng": 77.991887
  },
  "deviceFingerprint": "sha256-hash-of-device-characteristics",
  "sessionId": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Field Descriptions:**
- `name` (String, required): Full name of student
- `universityRollNo` (String, required): University roll number (unique identifier)
- `section` (String, required): Class section (e.g., "A", "B")
- `classRollNo` (String, required): Class roll number
- `location` (Object, required):
  - `lat` (Number): Latitude from geolocation
  - `lng` (Number): Longitude from geolocation
- `deviceFingerprint` (String, required): Hash of device characteristics
- `sessionId` (String, required): QR session ID from URL parameter

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Attendance marked successfully",
  "data": {
    "universityRollNo": "2024001",
    "date": "2024-05-12",
    "time": "09:30:00",
    "status": "present"
  }
}
```

**Response (400 Bad Request) - Validation Error:**
```json
{
  "status": "error",
  "message": "Please fill all fields"
}
```

**Response (400 Bad Request) - Duplicate Attendance:**
```json
{
  "status": "error",
  "message": "Attendance already marked today"
}
```

**Response (401 Unauthorized) - Invalid QR:**
```json
{
  "status": "error",
  "message": "Invalid QR session. Please scan again."
}
```

**Response (403 Forbidden) - Geolocation Out of Range:**
```json
{
  "status": "error",
  "message": "You are not within the attendance zone"
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:5000/mark-attendance \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "universityRollNo": "2024001",
    "section": "A",
    "classRollNo": "001",
    "location": {"lat": 30.2679634, "lng": 77.991887},
    "deviceFingerprint": "device-hash",
    "sessionId": "qr-session-id"
  }'
```

---

## Student Endpoints

### 3. Get Student Attendance

#### `GET /api/attendance?rollNo={universityRollNo}`

Retrieve attendance records for a specific student.

**Query Parameters:**
- `rollNo` (String, required): University roll number

**Response (200 OK):**
```json
{
  "status": "success",
  "name": "John Doe",
  "universityRollNo": "2024001",
  "attendance": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "universityRollNo": "2024001",
      "section": "A",
      "classRollNo": "001",
      "date": "2024-05-12",
      "time": "09:30:00",
      "location": {
        "lat": 30.2679634,
        "lng": 77.991887
      },
      "deviceFingerprint": "hash",
      "status": "present",
      "createdAt": "2024-05-12T09:30:00.000Z",
      "updatedAt": "2024-05-12T09:30:00.000Z"
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Roll number is required"
}
```

**Response (404 Not Found):**
```json
{
  "status": "error",
  "message": "Student not found"
}
```

**Curl Example:**
```bash
curl http://localhost:5000/api/attendance?rollNo=2024001
```

---

### 4. Get Student Profile

#### `GET /api/students/{universityRollNo}`

Get complete student profile information.

**URL Parameters:**
- `universityRollNo` (String): University roll number

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "universityRollNo": "2024001",
  "name": "John Doe",
  "section": "A",
  "classRollNo": "001",
  "cgpa": 3.8,
  "batch": "2024",
  "department": "Computer Science",
  "academicYear": "2024-2025",
  "dob": "2004-05-12",
  "gender": "Male",
  "email": "john.doe@university.edu",
  "contactNumber": "+91-9876543210",
  "address": "123 Main Street, City",
  "registrationNo": "REG2024001",
  "academicStatus": "Active",
  "personalInfo": {
    "fullName": "John Doe",
    "dateOfBirth": "2004-05-12",
    "gender": "Male"
  },
  "academicInfo": {
    "batch": "2024",
    "department": "Computer Science",
    "cgpa": 3.8
  }
}
```

**Response (404 Not Found):**
```json
{
  "status": "error",
  "message": "Student not found"
}
```

**Curl Example:**
```bash
curl http://localhost:5000/api/students/2024001
```

---

### 5. Create/Update Student Profile

#### `POST /api/students`

Create a new student profile.

**Request Body:**
```json
{
  "universityRollNo": "2024001",
  "name": "John Doe",
  "section": "A",
  "classRollNo": "001",
  "cgpa": 3.8,
  "batch": "2024",
  "department": "Computer Science",
  "email": "john.doe@university.edu"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "universityRollNo": "2024001",
  "name": "John Doe",
  "section": "A",
  "classRollNo": "001",
  "message": "Student profile created successfully"
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "universityRollNo": "2024001",
    "name": "John Doe",
    "section": "A",
    "classRollNo": "001"
  }'
```

---

### 6. Update Student Profile

#### `PUT /api/students/{universityRollNo}`

Update an existing student profile.

**URL Parameters:**
- `universityRollNo` (String): University roll number

**Request Body:** (Same as POST, fields to update)
```json
{
  "cgpa": 3.9,
  "email": "newemail@university.edu"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "universityRollNo": "2024001",
  "message": "Student profile updated successfully"
}
```

**Curl Example:**
```bash
curl -X PUT http://localhost:5000/api/students/2024001 \
  -H "Content-Type: application/json" \
  -d '{"cgpa": 3.9}'
```

---

## Analytics Endpoints

### 7. Get Students by Attendance Range

#### `GET /api/students/by-attendance-range?min={min}&max={max}`

Get all students whose attendance falls within a specified percentage range.

**Query Parameters:**
- `min` (Number, required): Minimum attendance percentage (0-100)
- `max` (Number, required): Maximum attendance percentage (0-100)

**Response (200 OK):**
```json
{
  "status": "success",
  "data": [
    {
      "universityRollNo": "2024001",
      "name": "John Doe",
      "section": "A",
      "attendancePercentage": 85,
      "presentDays": 17,
      "totalClasses": 20
    },
    {
      "universityRollNo": "2024002",
      "name": "Jane Smith",
      "section": "A",
      "attendancePercentage": 80,
      "presentDays": 16,
      "totalClasses": 20
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "status": "error",
  "message": "Both min and max percentage parameters are required"
}
```

**Valid Range Validation:**
- Both must be numbers (0-100)
- `min` cannot be greater than `max`

**Curl Example:**
```bash
curl "http://localhost:5000/api/students/by-attendance-range?min=75&max=90"
```

---

## Validation Endpoints

### 8. Validate QR Session

#### `POST /api/validate-session`

Validate if a QR session is still active and valid.

**Request Body:**
```json
{
  "sessionId": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Response (200 OK) - Valid:**
```json
{
  "valid": true,
  "message": "Session is valid"
}
```

**Response (200 OK) - Expired:**
```json
{
  "valid": false,
  "message": "Session has expired"
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:5000/api/validate-session \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "qr-session-id"}'
```

---

### 9. Consistent Hash Generation

#### `POST /api/consistent-hash`

Generate a consistent hash for device fingerprinting.

**Request Body:**
```json
{
  "input": "{\"userAgent\": \"Mozilla/5.0...\", \"screenResolution\": \"1920x1080\", ...}"
}
```

**Response (200 OK):**
```json
{
  "fingerprint": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
}
```

**Curl Example:**
```bash
curl -X POST http://localhost:5000/api/consistent-hash \
  -H "Content-Type: application/json" \
  -d '{"input": "device-fingerprint-data"}'
```

---

## Error Codes Reference

| HTTP Code | Error Type | Meaning | Solution |
|-----------|-----------|---------|----------|
| 200 | OK | Request successful | - |
| 201 | Created | Resource created | - |
| 400 | Bad Request | Invalid input/missing fields | Check request body |
| 401 | Unauthorized | Invalid QR session | Rescan QR code |
| 403 | Forbidden | Geolocation out of range | Move to correct location |
| 404 | Not Found | Student doesn't exist | Create student profile |
| 409 | Conflict | Duplicate attendance | Already marked today |
| 429 | Too Many Requests | Rate limited | Wait 1 minute |
| 500 | Internal Server Error | Database/server error | Contact admin |

---

## Rate Limiting

**QR Generation Endpoint:**
- Limit: 5 requests per minute per IP
- Returns: 429 Too Many Requests
- Reset: After 60 seconds

**Example:**
```
Request 1: ✅ Accepted
Request 2: ✅ Accepted
Request 3: ✅ Accepted
Request 4: ✅ Accepted
Request 5: ✅ Accepted
Request 6: ❌ 429 Too Many Requests
           (Wait 60 seconds before retry)
```

---

## Data Types & Formats

### Location Object
```json
{
  "lat": 30.2679634,
  "lng": 77.991887
}
```

### Attendance Record
```json
{
  "_id": "ObjectId",
  "name": "String",
  "universityRollNo": "String",
  "section": "String",
  "classRollNo": "String",
  "date": "YYYY-MM-DD format",
  "time": "HH:MM:SS format",
  "location": {
    "lat": "Number",
    "lng": "Number"
  },
  "deviceFingerprint": "SHA256 Hash",
  "status": "present|absent",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

### Student Profile
```json
{
  "_id": "ObjectId",
  "universityRollNo": "String (Unique)",
  "name": "String",
  "section": "String",
  "classRollNo": "String",
  "cgpa": "Number (0-4.0)",
  "batch": "String (Year)",
  "department": "String",
  "registeredAt": "ISO 8601 datetime"
}
```

---

## CORS Policy

Allowed Origins:
```
http://localhost:3000
http://localhost:5173 (Vite dev)
http://localhost:5000
```

**Add more origins in server.js:**
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true
}));
```

---

## Testing Tools

### Using cURL
```bash
# GET request
curl http://localhost:5000/api/attendance?rollNo=2024001

# POST request
curl -X POST http://localhost:5000/mark-attendance \
  -H "Content-Type: application/json" \
  -d '{"name":"John","universityRollNo":"2024001",...}'
```

### Using Postman
1. Import collection from `/docs/postman_collection.json`
2. Set environment variables
3. Run requests with one-click

### Using Insomnia
Similar to Postman, import and test

### Using Thunder Client (VS Code)
Quick and lightweight testing within VS Code

---

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Update MONGODB_URI to production database
- [ ] Set secure QR_SECRET_KEY
- [ ] Enable HTTPS
- [ ] Update CORS origins
- [ ] Set reasonable MAX_DISTANCE for geolocation
- [ ] Enable authentication middleware
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting thresholds
- [ ] Set up database backups

---

## Troubleshooting

### "QR session expired"
- QR codes are valid for 1.5 minutes only
- Solution: Generate a new QR code

### "Attendance already marked today"
- Each device can only mark attendance once per day
- Solution: Try again tomorrow or use different device

### "Student not found"
- Student profile doesn't exist in database
- Solution: Create student profile first via POST /api/students

### "Rate limit exceeded"
- Too many QR requests from same IP
- Solution: Wait 1 minute before requesting again

---

This API reference covers all main endpoints and their usage patterns!
