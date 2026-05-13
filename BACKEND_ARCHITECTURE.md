# Backend Architecture & Explanation

## Overview

The backend is a **Node.js/Express server** with **MongoDB database** that handles attendance tracking using QR codes, device fingerprinting, and geolocation. It's built with security and scalability in mind.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js (v5.1.0)
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: Bcryptjs
- **Security**: Helmet.js, CORS, Rate Limiting
- **QR Codes**: qrcode library
- **Additional**: UUID, ExcelJS, express-rate-limit

## Core Components

### 1. **Server Configuration** (`server.js`)

The main server file sets up:

- **CORS** - Cross-Origin Resource Sharing for frontend communication
- **Helmet** - Security middleware for HTTP headers
- **Rate Limiting** - Prevents abuse of QR generation endpoint
- **Static Files** - Serves React build files and QR code images
- **MongoDB Connection** - Connects to MongoDB database

```
Key Configuration:
- CLASS_LAT = 30.2679634
- CLASS_LNG = 77.991887
- MAX_DISTANCE_METERS = 10000000000000 (essentially no distance limit)
- QR_CODE_VALIDITY = 1.5 minutes
```

### 2. **Data Models** (`models/`)

#### **User.js** - Student Information
```javascript
{
  name: String,
  universityRollNo: String (unique),
  section: String,
  classRollNo: String,
  registeredAt: Date
}
```

#### **Attendance.js** - Attendance Records
```javascript
{
  name: String,
  universityRollNo: String,
  section: String,
  classRollNo: String,
  date: String,
  time: String,
  location: {
    lat: Number,
    lng: Number
  },
  deviceFingerprint: String,
  status: String (default: "present"),
  studentId: ObjectId (ref to User),
  timestamps: true
}
```

Indexes:
- `universityRollNo + date` - Fast lookup of attendance by student and date
- `deviceFingerprint + date` - Detect duplicate/cheating attempts

#### **StudentProfile.js** - Additional Student Data
- Extended profile information (CGPA, batch, department, etc.)
- Personal and academic details
- Skills and learning activities

#### **Other Models**
- **AdminSession.js** - Admin user sessions
- **CampusLocation.js** - Campus locations for geofencing
- **CampusPath.js** - Paths between campus locations
- **Friendship.js** - Social connections between students
- **IoTDevice.js / IoTConnection.js** - IoT device tracking
- **LearningActivity.js** - Student learning records
- **QRLog.js** - QR code generation logs
- **Setting.js** - System settings

---

## API Routes

### **Attendance Routes** (`routes/attendance.js`)

#### `GET /api/attendance/`
Fetch attendance records for a student

**Query Parameters:**
- `rollNo` (required) - University roll number

**Response:**
```json
{
  "status": "success",
  "name": "John Doe",
  "universityRollNo": "2024001",
  "attendance": [
    {
      "name": "John Doe",
      "date": "2024-05-12",
      "time": "09:30:00",
      "location": { "lat": 30.2679, "lng": 77.9919 },
      "status": "present"
    }
  ]
}
```

### **Student Profile Routes** (`routes/studentProfile.js`)

- `GET /api/students/:rollNo` - Get student profile
- `POST /api/students` - Create new student profile
- `PUT /api/students/:rollNo` - Update student profile

### **Attendance Marking** (`/mark-attendance`)

**Main attendance submission endpoint**

**POST Request:**
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
  "deviceFingerprint": "hash-of-device-characteristics",
  "sessionId": "qr-session-id"
}
```

**Validation Steps:**
1. Check if QR session is valid
2. Verify device fingerprint (prevent cheating)
3. Check geolocation (optional - currently disabled with large threshold)
4. Prevent duplicate attendance same day
5. Generate timestamp with timezone
6. Save to MongoDB

**Response:**
```json
{
  "status": "success",
  "message": "Attendance marked successfully",
  "data": {
    "universityRollNo": "2024001",
    "date": "2024-05-12"
  }
}
```

---

## QR Code System (`qr-generator.js`)

### **QR Code Generation Flow**

1. **Generate Session ID**: Random 16-byte cryptographic token
2. **Create Hash**: SHA-256 hash of (sessionId + timestamp + secret)
3. **Encode Data**: Package into URL with parameters
4. **Generate PNG**: Create QR image file with timestamp-based naming
5. **Cache**: Store in IP cache for 90 seconds to prevent re-generation

### **QR Code Validity**
- **Validity Duration**: 1.5 minutes (90 seconds)
- **Cache Duration**: 90 seconds (matches validity)
- **Auto-cleanup**: Old QR codes deleted on server startup

### **Session Validation**
```javascript
// Tracks active sessions with:
- sessionId (unique identifier)
- timestamp (creation time)
- ipAddress (requester IP)
- hash (validation token)
```

---

## Security Features

### 1. **Device Fingerprinting** (`utils/fingerprint.js`)

Prevents users from marking attendance multiple times:

**Fingerprint Components:**
- User Agent (browser/device info)
- Screen Resolution
- Timezone
- Language Settings
- Hardware Concurrency (CPU cores)
- Device Memory
- Touch Support
- Canvas Hash (graphical fingerprint)
- Daily Salt (changes each day)

**Result**: Consistent hash via Java/SHA256 implementation

### 2. **Geolocation Verification** (Currently Permissive)

```javascript
const MAX_DISTANCE_METERS = 10000000000000; // ~distance to moon
```

Currently allows attendance from anywhere. Can be tightened by:
- Setting realistic MAX_DISTANCE (e.g., 100 meters)
- Using Haversine formula to calculate actual distance

### 3. **Rate Limiting**

- **QR Generation**: Max 5 requests per minute per IP
- Returns 429 (Too Many Requests) when exceeded

### 4. **Helmet Security Headers**

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

---

## Advanced Features

### **Algorithm Modules** (`algorithms/`)

The server includes advanced graph/optimization algorithms:

1. **Dijkstra's Algorithm** (`dijkstra.js`)
   - Find shortest path between campus locations
   - Graph-based route optimization

2. **Profile Optimizer** (`profileOptimizer.js`)
   - Recommend skill development paths
   - Personalized learning suggestions
   - Student profile enhancement

3. **Graph Traversal** (`graphTraversal.js`)
   - Explore student communities
   - Find connections between students
   - Network analysis

### **Cryptographic Functions**

- **SHA256.java** - Java implementation of SHA-256 hashing
- **ConsistentHash.java** - Consistent hashing for distributed systems
- **Haversine.java** - Calculate distance between GPS coordinates

---

## Database Queries

### **Attendance Statistics**

```javascript
// Get students by attendance range
GET /api/students/by-attendance-range?min=75&max=85

// Uses MongoDB aggregation:
1. $lookup with Users collection
2. $lookup with Attendance collection (filter by date and status)
3. $addFields to calculate percentage
4. $match to filter by range
5. $sort by attendance percentage
```

### **Duplicate Detection**

```javascript
// Find students with duplicate attendance attempts
// Based on: universityRollNo + date + different deviceFingerprint
// Flags potential cheating
```

---

## Request Flow for Attendance Marking

```
1. Frontend generates QR code
   └─> User scans with device
   
2. Device submits attendance form
   └─> POST /mark-attendance
   
3. Server validates:
   ├─> Check QR session validity
   ├─> Verify device fingerprint
   ├─> Check geolocation (if strict mode)
   ├─> Prevent duplicate same day
   └─> Validate all fields
   
4. Server processes:
   ├─> Generate timestamp
   ├─> Create/update User if new
   ├─> Create Attendance record
   └─> Return success response
   
5. Frontend redirects to Dashboard
   └─> Displays student attendance stats
```

---

## Error Handling

### **Common Error Codes**

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check all required fields |
| 401 | Unauthorized | Invalid QR session |
| 404 | Not Found | Student doesn't exist |
| 409 | Conflict | Duplicate attendance today |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Database connection issue |

---

## Environment Variables Required

```bash
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
QR_SECRET_KEY=your-secret-key-for-hashing
NODE_ENV=production
PORT=5000
```

---

## Static File Serving

```javascript
// React build (production)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to source files (development)
app.use(express.static(path.join(__dirname, '../frontend')));

// QR codes directory
app.use('/qrcodes', express.static(QR_CODE_DIR));

// SPA catch-all (serves index.html for React routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

---

## Performance Considerations

1. **Indexed Queries**: Fast attendance lookups
2. **Session Caching**: Reduces redundant QR generation
3. **Connection Pooling**: MongoDB connection reuse
4. **Static File Caching**: 1-hour cache for QR codes
5. **Rate Limiting**: Prevents server overload

---

## Scalability Features

- **Consistent Hashing**: Supports distributed deployment
- **Aggregate Queries**: Efficient analytics at scale
- **Indexed Collections**: Optimized for large datasets
- **Session Tracking**: Can be moved to Redis for clustering

---

## Development Commands

```bash
# Start server (no auto-reload)
node server.js

# Alternative: Use nodemon for development
npm install -D nodemon
nodemon server.js

# Server runs on: http://localhost:5000
# API Base: http://localhost:5000/api/
```

---

## Testing Endpoints

### **1. Generate QR Code**
```bash
GET http://localhost:5000/api/generate-qr
```

### **2. Mark Attendance**
```bash
POST http://localhost:5000/mark-attendance
Content-Type: application/json

{
  "name": "Test Student",
  "universityRollNo": "2024001",
  "section": "A",
  "classRollNo": "001",
  "location": {"lat": 30.2679634, "lng": 77.991887},
  "deviceFingerprint": "test-fingerprint",
  "sessionId": "test-session-id"
}
```

### **3. Get Attendance**
```bash
GET http://localhost:5000/api/attendance/?rollNo=2024001
```

### **4. Get Student Profile**
```bash
GET http://localhost:5000/api/students/2024001
```

---

## Conclusion

The backend is a comprehensive attendance system combining:
- ✅ Real-time QR code generation and validation
- ✅ Device fingerprinting for fraud prevention
- ✅ Geolocation tracking (with flexible thresholds)
- ✅ Advanced analytics with MongoDB aggregation
- ✅ Security hardening with Helmet & CORS
- ✅ Rate limiting for abuse prevention
- ✅ Scalable architecture with consistent hashing

Perfect for educational institutions requiring robust attendance tracking!
