# Backend Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        QR ATTENDANCE SYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

                            FRONTEND (React)
                           ┌──────────────┐
                           │ Attendance   │
                           │   Form       │
                           └──────┬───────┘
                                  │
                   ┌──────────────┼──────────────┐
                   │              │              │
            1. Scan QR    2. Submit Form  3. View Dashboard
                   │              │              │
                   ▼              ▼              ▼
        ┌──────────────────────────────────────────────┐
        │              EXPRESS SERVER (5000)           │
        └──────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       SECURITY           ROUTES               FEATURES
          │                   │                   │
    ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
    │ • CORS      │    │ QR Routes   │    │ • Fingerprint│
    │ • Helmet    │    │ • Attendance│    │ • Geolocation│
    │ • Rate Limit│    │ • Students  │    │ • Hashing    │
    │ • Helmet CSP│    │ • Analytics │    │ • Algorithms │
    └─────────────┘    └─────────────┘    └──────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                    ┌─────────────────┐
                    │   MONGODB       │
                    │   DATABASE      │
                    └─────────────────┘
```

## Detailed Request Flow

### A. QR Code Generation Flow

```
┌─────────────────────────────────────────────────────────┐
│              QR CODE GENERATION PROCESS                 │
└─────────────────────────────────────────────────────────┘

Step 1: Frontend Request
        │
        ├─ GET /api/generate-qr?ipAddress=192.168.1.1
        │
        ▼

Step 2: Server Receives Request
        │
        ├─ Check IP cache (90 second TTL)
        ├─ If cached: Return cached QR data
        └─ If new: Continue to Step 3
                   │
                   ▼

Step 3: Generate Session
        │
        ├─ sessionId = crypto.randomBytes(16).toString('hex')
        ├─ timestamp = Date.now()
        ├─ hash = SHA256(sessionId + timestamp + secret)
        │
        ▼

Step 4: Create QR Data URL
        │
        ├─ qrData = `http://localhost:5000/verify-attendance?data=${encodeURIComponent(JSON.stringify({
        │    sessionId,
        │    timestamp,
        │    hash
        │  }))}`
        │
        ▼

Step 5: Generate PNG File
        │
        ├─ fileName = `qr_${timestamp}.png`
        ├─ filePath = /frontend/public/qrcodes/qr_${timestamp}.png
        ├─ Use qrcode library to generate PNG
        │
        ▼

Step 6: Cache & Return
        │
        ├─ Store in ipCache[ipAddress] = { data, timestamp }
        ├─ Set maxAge = 1.5 minutes (90,000 ms)
        ├─ Return QR image URL to frontend
        │
        ▼

Step 7: Frontend Display
        │
        └─ Display QR code on /index route (attendance form page)
```

### B. Attendance Marking Flow

```
┌──────────────────────────────────────────────────────────────┐
│            ATTENDANCE SUBMISSION FLOW                        │
└──────────────────────────────────────────────────────────────┘

Frontend Action: Student fills form and clicks "Submit Attendance"
                                    │
                                    ▼

┌─ Gather Data ────────────────────────────────────────┐
│                                                      │
│  const payload = {                                   │
│    name,                      // From form           │
│    universityRollNo,          // From form           │
│    section,                   // From form           │
│    classRollNo,               // From form           │
│    location: {                // From Geolocation API│
│      lat,                                            │
│      lng                                             │
│    },                                                │
│    deviceFingerprint,         // Generated locally   │
│    sessionId                  // From URL params     │
│  }                                                   │
│                                                      │
└──────────────────────────────────────────────────────┘
                                    │
                                    ▼

┌─ POST /mark-attendance ──────────────────────────────┐
│                                                      │
│  Content-Type: application/json                     │
│  Body: {...payload}                                 │
│                                                      │
└──────────────────────────────────────────────────────┘
                                    │
                                    ▼

SERVER-SIDE VALIDATION:

┌─ Check 1: Validate QR Session ─────────────────────┐
│                                                     │
│  if (!sessionId) throw Error("No QR session")       │
│  if (!activeSessions.has(sessionId))                │
│    throw Error("Invalid/expired QR")                │
│  if (Date.now() - sessionTime > 90000)              │
│    throw Error("QR session expired (1.5 min)")      │
│                                                     │
└─────────────────────────────────────────────────────┘
                                    │
                                    ▼

┌─ Check 2: Verify Device Fingerprint ───────────────┐
│                                                     │
│  # Device fingerprint is cached per day             │
│  const today = new Date().toISOString().split('T')[0]
│                                                     │
│  # Check if this device already marked today        │
│  const existing = await Attendance.findOne({        │
│    universityRollNo,                                │
│    deviceFingerprint,                               │
│    date: today                                      │
│  })                                                 │
│                                                     │
│  if (existing) {                                    │
│    throw Error("Duplicate: Already marked today")   │
│  }                                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
                                    │
                                    ▼

┌─ Check 3: Validate Geolocation (Optional) ─────────┐
│                                                     │
│  # Currently disabled (MAX_DISTANCE very large)     │
│  const distance = haversine(                        │
│    {lat: location.lat, lng: location.lng},          │
│    {lat: CLASS_LAT, lng: CLASS_LNG}                 │
│  )                                                  │
│                                                     │
│  if (distance > MAX_DISTANCE_METERS) {              │
│    throw Error("Outside attendance zone")           │
│  }                                                  │
│                                                     │
│  # Tip: Set MAX_DISTANCE to ~100 for strict mode   │
│                                                     │
└─────────────────────────────────────────────────────┘
                                    │
                                    ▼

┌─ Check 4: Validate All Fields ─────────────────────┐
│                                                     │
│  const required = ['name', 'universityRollNo',      │
│                   'section', 'classRollNo']         │
│                                                     │
│  for (field of required) {                          │
│    if (!payload[field]) {                           │
│      throw Error(`Missing: ${field}`)               │
│    }                                                │
│  }                                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
                                    │
                                    ▼

DATABASE OPERATIONS:

┌─ Check 5: Create/Update User ──────────────────────┐
│                                                     │
│  await User.findOneAndUpdate(                       │
│    { universityRollNo },                            │
│    {                                                │
│      name,                                          │
│      section,                                       │
│      classRollNo,                                   │
│      registeredAt: new Date()                       │
│    },                                               │
│    { upsert: true, new: true }                      │
│  )                                                  │
│                                                     │
│  # upsert: Create if doesn't exist                  │
│                                                     │
└─────────────────────────────────────────────────────┘
                                    │
                                    ▼

┌─ Check 6: Create Attendance Record ────────────────┐
│                                                     │
│  const attendance = new Attendance({                │
│    name,                                            │
│    universityRollNo,                                │
│    section,                                         │
│    classRollNo,                                     │
│    date: new Date().toISOString().split('T')[0],   │
│    time: new Date().toLocaleTimeString('en-IN'),   │
│    location,                                        │
│    deviceFingerprint,                               │
│    status: "present",                               │
│    studentId: user._id                              │
│  })                                                 │
│                                                     │
│  await attendance.save()                            │
│                                                     │
└─────────────────────────────────────────────────────┘
                                    │
                                    ▼

┌─ Return Success Response ──────────────────────────┐
│                                                     │
│  res.json({                                         │
│    status: "success",                               │
│    message: "Attendance marked successfully",       │
│    data: {                                          │
│      universityRollNo,                              │
│      date: today                                    │
│    }                                                │
│  })                                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
                                    │
                                    ▼

FRONTEND ACTION:

        Display success message
        Redirect to Dashboard (/dashboard?rollNo=2024001)
```

### C. Get Attendance Records Flow

```
┌──────────────────────────────────────────────────────┐
│        RETRIEVE ATTENDANCE RECORDS FLOW              │
└──────────────────────────────────────────────────────┘

Frontend Action: Navigate to Dashboard
                                    │
                                    ▼

GET /api/attendance/?rollNo=2024001
                                    │
                                    ▼

┌─ Validate Input ───────────────────────────────────┐
│                                                    │
│  if (!rollNo) {                                    │
│    return Error("Roll number is required")         │
│  }                                                 │
│                                                    │
└────────────────────────────────────────────────────┘
                                    │
                                    ▼

┌─ Fetch Student Info ───────────────────────────────┐
│                                                    │
│  const student = await User.findOne({              │
│    universityRollNo: rollNo                        │
│  })                                                │
│                                                    │
│  if (!student) {                                   │
│    return Error("Student not found")               │
│  }                                                 │
│                                                    │
└────────────────────────────────────────────────────┘
                                    │
                                    ▼

┌─ Fetch Attendance Records ─────────────────────────┐
│                                                    │
│  const records = await Attendance.find({           │
│    universityRollNo: rollNo                        │
│  })                                                │
│  .sort({ date: -1, time: -1 })  # Newest first     │
│  .exec()                                           │
│                                                    │
│  # Result: Array of attendance records with:       │
│  # - name, date, time, location, status            │
│                                                    │
└────────────────────────────────────────────────────┘
                                    │
                                    ▼

┌─ Return Response ──────────────────────────────────┐
│                                                    │
│  res.json({                                        │
│    status: "success",                              │
│    name: student.name,                             │
│    universityRollNo: student.universityRollNo,     │
│    attendance: [                                   │
│      {                                             │
│        date: "2024-05-12",                         │
│        time: "09:30:00",                           │
│        location: {lat, lng},                       │
│        status: "present"                           │
│      },                                            │
│      ...more records                               │
│    ]                                               │
│  })                                                │
│                                                    │
└────────────────────────────────────────────────────┘
                                    │
                                    ▼

FRONTEND: Display in StudentDashboard
          - Calculate attendance percentage
          - Generate charts
          - Show personal information
```

## Database Schema Relationships

```
┌─────────────────────┐
│      USERS          │
├─────────────────────┤
│ _id (ObjectId)      │◄─────────┐
│ name                │          │
│ universityRollNo    │          │
│ section             │          │
│ classRollNo         │          │
│ registeredAt        │          │
└─────────────────────┘          │
          ▲                      │
          │                      │
          └──────────────────────┘
             (studentId)

┌──────────────────────────────────┐
│       ATTENDANCE                 │
├──────────────────────────────────┤
│ _id (ObjectId)                   │
│ name                             │
│ universityRollNo ───────────────►│ references Users
│ section                          │
│ classRollNo                      │
│ date                             │
│ time                             │
│ location {lat, lng}              │
│ deviceFingerprint                │
│ status                           │
│ studentId (ref User)             │
│ createdAt / updatedAt            │
├──────────────────────────────────┤
│ INDEXES:                         │
│ • universityRollNo + date        │
│ • deviceFingerprint + date       │
└──────────────────────────────────┘

┌──────────────────────────┐
│   STUDENT_PROFILE        │
├──────────────────────────┤
│ _id (ObjectId)           │
│ universityRollNo         │
│ cgpa                     │
│ batch                    │
│ department               │
│ academicYear             │
│ personalInfo {...}       │
│ academicInfo {...}       │
│ skills [...]             │
└──────────────────────────┘
```

## Security Layers Visualization

```
┌─────────────────────────────────────────────────────┐
│           SECURITY LAYERS (Defense in Depth)        │
└─────────────────────────────────────────────────────┘

Layer 1: Network Security
├─ CORS: Only allow requests from trusted origins
├─ Helmet: Security HTTP headers
│  ├─ CSP (Content Security Policy)
│  ├─ X-Frame-Options: DENY
│  ├─ X-Content-Type-Options: nosniff
│  └─ X-XSS-Protection: 1; mode=block
└─ HTTPS (in production)

         ▼

Layer 2: Rate Limiting
├─ QR Generation: Max 5 requests/minute/IP
├─ Returns: 429 Too Many Requests
└─ Prevents brute force attacks

         ▼

Layer 3: Session Validation
├─ QR Code has unique sessionId
├─ Validated timestamp
├─ Cryptographic hash verification
├─ 90-second expiration
└─ IP binding (optional)

         ▼

Layer 4: Device Fingerprinting
├─ Collect 10+ device characteristics
├─ Generate SHA-256 hash
├─ Cache per day
├─ Detect duplicate submissions
└─ Flag potential cheating

         ▼

Layer 5: Data Validation
├─ Required field checking
├─ Type validation
├─ Duplicate prevention
│  └─ Same universityRollNo + date + deviceFingerprint
└─ Geolocation validation (optional)

         ▼

Layer 6: Database Level
├─ Unique indexes
├─ Compound indexes for queries
├─ Schema validation
└─ MongoDB access control

         ▼

Layer 7: Encryption
├─ Device fingerprint hashing
├─ QR session tokens
├─ Password hashing (bcryptjs)
└─ Data at rest (MongoDB encryption)
```

## Performance Optimization

```
┌────────────────────────────────────────────┐
│     PERFORMANCE OPTIMIZATIONS              │
└────────────────────────────────────────────┘

1. Database Indexing
   ├─ universityRollNo + date (Attendance lookup)
   ├─ deviceFingerprint + date (Duplicate detection)
   └─ Results in O(log n) queries instead of O(n)

2. QR Code Caching
   ├─ 90-second IP-based cache
   ├─ Prevents redundant file generation
   └─ Reduces CPU and disk I/O

3. Connection Pooling
   ├─ Mongoose manages MongoDB connection pool
   ├─ Reuses connections across requests
   └─ Reduces connection overhead

4. Session Storage
   ├─ In-memory Map for active sessions
   ├─ Fast O(1) lookups
   └─ Can migrate to Redis for clustering

5. Static File Caching
   ├─ QR codes: 1-hour cache header
   ├─ React build files: Far-future expiry
   └─ Browser-level caching reduces requests

6. Aggregation Pipeline
   ├─ MongoDB server-side processing
   ├─ Reduces data transfer
   └─ Faster analytics queries
```

---

**This diagram visualizes how all components work together in the QR-Based Attendance System!**
