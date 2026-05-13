# Backend System Explanation - Complete Summary

## 🎯 Quick Overview

The **Backend** is a Node.js/Express server that manages the entire attendance system:

```
┌─────────────────┐
│  React Frontend │ (What users see)
└────────┬────────┘
         │
         │ HTTP Requests
         ▼
┌──────────────────────────┐
│   Express Server (5000)   │ ◄── YOU ARE HERE
│ - QR Generation          │
│ - Attendance Tracking    │
│ - Data Processing        │
│ - Security/Validation    │
└────────┬─────────────────┘
         │
         │ Database Queries
         ▼
    ┌─────────────┐
    │  MongoDB    │ (Where data lives)
    └─────────────┘
```

---

## 🔧 What Does the Backend Do?

### 1. **QR Code Management**
   - **Generate** unique QR codes every 1.5 minutes
   - Each QR contains: sessionId + timestamp + cryptographic hash
   - **Validate** QR codes when students submit attendance
   - **Cleanup** old QR files automatically

### 2. **Attendance Processing**
   - **Receive** student info + location + device data
   - **Validate** all information
   - **Check** for duplicates (same person can't mark twice today)
   - **Store** attendance record in MongoDB
   - **Return** success/error response

### 3. **Security & Fraud Prevention**
   - **Device Fingerprinting**: Creates unique hash from device characteristics
   - **Geolocation Checking**: Verifies student is in the right location
   - **Rate Limiting**: Max 5 QR requests per minute
   - **Session Validation**: QR codes expire after 90 seconds
   - **Duplicate Prevention**: One device = one attendance per day

### 4. **Data Retrieval**
   - **Student Attendance**: Get all attendance records for a student
   - **Student Profile**: Get personal/academic information
   - **Analytics**: Find students by attendance percentage range
   - **Sorting & Filtering**: Most recent first, by percentage, etc.

---

## 📊 Data Flow Examples

### Example 1: Generating QR Code
```
Student visits attendance page
         │
         ├─► Browser sends: GET /api/generate-qr
         │
         ▼
Server receives request
         │
         ├─► Check if same IP requested recently (cache check)
         ├─► Generate random sessionId
         ├─► Create SHA256 hash for validation
         ├─► Create QR image file
         ├─► Store session info in memory
         │
         ▼
Browser receives response with QR image
         │
         └─► Display QR code on screen for scanning
```

### Example 2: Marking Attendance
```
Student scans QR → fills form → clicks submit
         │
         ├─► Browser collects:
         │   - Form data (name, roll number, etc.)
         │   - GPS location (latitude, longitude)
         │   - Device fingerprint (device characteristics)
         │   - QR sessionId (from URL)
         │
         ▼
Send POST /mark-attendance with all data
         │
         ▼
Server validates (7-step process):
    ├─ Step 1: Is QR session valid?
    ├─ Step 2: Has this device already marked today? (duplicate check)
    ├─ Step 3: Is location within allowed area?
    ├─ Step 4: Are all fields filled?
    ├─ Step 5: Create/update Student record
    ├─ Step 6: Create Attendance record
    └─ Step 7: Return success response
         │
         ▼
Save to MongoDB:
    ├─ Update Users collection (if new student)
    └─ Insert into Attendance collection
         │
         ▼
Response sent to frontend
    └─► Redirect to Dashboard
```

### Example 3: Viewing Attendance
```
Student clicks "View Dashboard"
         │
         ├─► Browser sends: GET /api/attendance?rollNo=2024001
         │
         ▼
Server queries MongoDB:
    ├─ Find all Attendance records for this rollNo
    ├─ Sort by date (newest first)
    └─ Get total count
         │
         ▼
Calculate statistics:
    ├─ Total days present: 17
    ├─ Total days absent: 3
    ├─ Attendance percentage: 17/20 = 85%
         │
         ▼
Response to frontend with all data
    └─► Dashboard displays charts and stats
```

---

## 🛡️ Security Layers (Why It's Safe)

### Layer 1: Rate Limiting
```
Attacker tries to generate 100 QR codes:
  Request 1-5: ✅ Allowed
  Request 6+: ❌ 429 Too Many Requests
  
Solution: Wait 60 seconds before trying again
```

### Layer 2: Device Fingerprinting
```
Device characteristics collected:
  ✓ Browser user agent
  ✓ Screen resolution
  ✓ Timezone
  ✓ Language
  ✓ CPU cores
  ✓ RAM amount
  ✓ Canvas fingerprint (graphics test)
  ✓ Today's date (changes daily)

→ Creates SHA256 hash of all combined
→ Same person ≠ Same device fingerprint
→ Prevents sharing QR with friends
```

### Layer 3: QR Code Expiration
```
QR Code Timeline:
  09:00 - QR generated (valid from now)
  09:01 - 29 seconds pass
  09:01:30 - QR still valid
  09:02 - QR expires! ❌ (1.5 min = 90 sec)
  
User must get new QR code
```

### Layer 4: Session Validation
```
QR Contains:
  {
    sessionId: "a1b2c3d4...", (random token)
    timestamp: 1715507400000, (when created)
    hash: "sha256hash..."     (verification)
  }

Server checks:
  ✓ sessionId exists in active sessions
  ✓ Not expired (< 90 seconds old)
  ✓ Hash matches SHA256(sessionId + timestamp + secret)
```

### Layer 5: Duplicate Prevention
```
John marks attendance at 09:30:00
  Database saves:
  {
    universityRollNo: "2024001",
    date: "2024-05-12",
    deviceFingerprint: "device-hash-abc123",
    status: "present"
  }

Same device tries again at 09:35:00
  Server checks: Does record already exist for:
    universityRollNo="2024001" 
    + date="2024-05-12" 
    + deviceFingerprint="device-hash-abc123"?
  
  ✅ YES → Error: "Already marked today"
  ❌ Different device → Allowed
```

---

## 📁 Important Files

### Core Files
```
server.js                          (Main server, 983 lines)
├─ Sets up Express server
├─ Configures middleware (CORS, Helmet, Rate Limiting)
├─ Defines all routes
└─ Handles QR code directory
```

### Models (Database Schemas)
```
models/
├─ User.js                    (Basic student info)
├─ Attendance.js              (Attendance records)
├─ StudentProfile.js          (Extended student info)
├─ QRLog.js                   (QR code history)
└─ [Other models...]          (Additional features)
```

### Routes (API Endpoints)
```
routes/
├─ attendance.js              (Get attendance records)
├─ studentProfile.js          (Student profile operations)
└─ attendanceRoutes.js        (Attendance-related routes)
```

### QR Code System
```
qr-generator.js               (Handles QR generation/validation)
├─ generateQRCode()           (Creates QR image)
├─ validateSession()          (Checks if QR is valid)
├─ activeSessions Map         (Tracks valid sessions)
└─ ipCache Map                (Caches per IP)
```

### Algorithms
```
algorithms/
├─ dijkstra.js               (Shortest path)
├─ profileOptimizer.js       (Student recommendations)
├─ graphTraversal.js         (Community analysis)
├─ floydWarshall.js          (All-pairs shortest path)
└─ mst.js                    (Minimum spanning tree)
```

### Security
```
SHA256.java                   (Hashing for fingerprints)
ConsistentHash.java           (Distributed system hashing)
Haversine.java                (GPS distance calculation)
```

---

## 🔌 Main Endpoints Used by Frontend

### For Attendance Form Page
```
GET  /api/generate-qr           → Get QR code
POST /mark-attendance            → Submit attendance
GET  /api/validate-session       → Check QR validity
POST /api/consistent-hash        → Generate device hash
```

### For Dashboard Page
```
GET  /api/attendance?rollNo=... → Get all attendance records
GET  /api/students/{rollNo}      → Get student profile
```

### Admin Features (Optional)
```
GET  /api/students/by-attendance-range?min=75&max=85
     → Get all students with 75-85% attendance
```

---

## 🚀 How to Run Backend

### Prerequisites
```bash
Node.js installed
MongoDB running (local or cloud)
```

### Setup
```bash
cd backend
npm install              # Install dependencies
```

### Configuration
Create `.env` file:
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/database
QR_SECRET_KEY=your-secret-key-for-hashing
PORT=5000
NODE_ENV=development
```

### Run
```bash
node server.js           # Start server (no auto-reload)
# or
npx nodemon server.js    # With auto-reload (needs: npm install -D nodemon)
```

### Verify
```
✅ Server running on: http://localhost:5000
✅ MongoDB connected
✅ Serving React frontend from: /frontend/dist
✅ QR codes directory: /frontend/public/qrcodes
```

---

## 📈 Database Structure

### Collections (Tables)

#### 1. **Users**
```
{
  _id: ObjectId,
  name: "John Doe",
  universityRollNo: "2024001",     ← Unique identifier
  section: "A",
  classRollNo: "001",
  registeredAt: Date
}
```

#### 2. **Attendances**
```
{
  _id: ObjectId,
  name: "John Doe",
  universityRollNo: "2024001",     ← Links to Users
  section: "A",
  classRollNo: "001",
  date: "2024-05-12",
  time: "09:30:00",
  location: {lat: 30.2679, lng: 77.9919},
  deviceFingerprint: "hash-abc123",
  status: "present",
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **StudentProfiles**
```
{
  _id: ObjectId,
  universityRollNo: "2024001",
  cgpa: 3.8,
  batch: "2024",
  department: "Computer Science",
  email: "john@university.edu",
  dob: "2004-05-12",
  [... more fields ...]
}
```

---

## 🎓 Example: Complete Flow

### Step 1: Teacher creates attendance session
```
Teacher clicks "Start Session"
  → Server generates QR code
  → QR displays on class screen
  → Students have 1.5 minutes to scan
```

### Step 2: Student scans QR
```
Student opens attendance app
Student scans QR code on screen
  → QR decoded → sessionId extracted
  → Browser shows attendance form
  → Student fills: Name, Roll No, Section, Class Roll
```

### Step 3: Student's browser generates fingerprint
```
Browser collects device info:
  - User Agent: "Mozilla/5.0..."
  - Screen: 1920x1080
  - Timezone: Asia/Kolkata
  - Cores: 8
  - Memory: 16GB
  - Canvas: [generates test image]
  
All hashed → "abc123def456..." (40-character hash)
```

### Step 4: Browser requests GPS location
```
Browser asks: "Can I access your location?"
Student clicks: "Allow"
  → GPS gives: lat=30.2679, lng=77.9919
```

### Step 5: Form submitted to server
```
POST /mark-attendance with:
{
  name: "John Doe",
  universityRollNo: "2024001",
  section: "A",
  classRollNo: "001",
  location: {lat: 30.2679, lng: 77.9919},
  deviceFingerprint: "abc123def456...",
  sessionId: "qr-session-id"
}
```

### Step 6: Server validates (happens instantly)
```
✅ QR session valid? (within 90 seconds)
✅ Device not already submitted? (no duplicates)
✅ Location reasonable? (anywhere if permissive)
✅ All fields filled?
✅ Create database records
✅ Return success
```

### Step 7: Frontend shows success
```
"✅ Attendance marked successfully!"
Redirect to dashboard after 1.5 seconds
```

### Step 8: Dashboard displays stats
```
Student sees:
- Attendance percentage: 85%
- Days present: 17
- Days absent: 3
- Calendar view of all submissions
```

---

## 🔍 Debugging Tips

### Check if server is running
```bash
curl http://localhost:5000/api/generate-qr
```

### Check database connection
Look for log: `"✅ MongoDB connected"`

### View QR code cache
```javascript
// In server.js, add:
console.log(activeSessions); // Shows active QR sessions
console.log(ipCache);        // Shows cached IPs
```

### Monitor attendance submissions
```bash
# Watch server logs for POST /mark-attendance
# Check MongoDB collections:
db.users.find()
db.attendances.find()
```

---

## 🎯 Key Takeaways

1. **Backend is the brain**: All logic, validation, security happens here
2. **QR codes are temporary**: Valid for only 1.5 minutes
3. **Device fingerprints prevent cheating**: One device = one attendance per day
4. **MongoDB stores everything**: Users, attendance records, profiles
5. **Validation happens server-side**: Frontend can't bypass security
6. **API is RESTful**: Standard HTTP methods (GET, POST, PUT)
7. **Rate limiting prevents abuse**: Max 5 QR requests/minute/IP

---

**Need more details? Check:**
- `BACKEND_ARCHITECTURE.md` - Deep technical details
- `BACKEND_FLOW_DIAGRAMS.md` - Visual flow diagrams
- `BACKEND_API_REFERENCE.md` - All API endpoints & examples
