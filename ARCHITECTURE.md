# Architecture Overview

## Project Structure

```
QR-Based-Attendance-System/
│
├── frontend/                           # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── AttendanceForm.jsx     # Attendance submission form
│   │   │   └── StudentDashboard.jsx   # Student dashboard
│   │   ├── services/
│   │   │   └── api.js                 # Centralized API calls
│   │   ├── utils/
│   │   │   └── fingerprint.js         # Device fingerprinting
│   │   ├── App.jsx                    # Main app with routing
│   │   ├── main.jsx                   # React entry point
│   │   ├── App.css                    # App styles
│   │   └── index.css                  # Tailwind directives
│   ├── dist/                          # Production build (created by npm run build)
│   ├── package.json                   # Dependencies
│   ├── vite.config.js                 # Vite configuration
│   ├── tailwind.config.js             # Tailwind configuration
│   └── postcss.config.js              # PostCSS configuration
│
├── backend/                           # Express.js backend
│   ├── server.js                      # Main server file (updated for React)
│   ├── routes/
│   ├── models/
│   ├── algorithms/
│   └── public/
│       └── qrcodes/                   # QR code storage
│
├── data/                              # MongoDB data (local)
│
└── Documentation/
    ├── REACT_MIGRATION.md             # Detailed migration guide
    ├── QUICK_START.md                 # Quick start guide
    └── MIGRATION_COMPLETE.md          # Completion summary
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 5173)               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              App.jsx (Router Setup)                 │  │
│  │  ┌────────────────┐        ┌──────────────────────┐│  │
│  │  │AttendanceForm  │───┬───▶│ StudentDashboard   ││  │
│  │  │  Component     │   │    │    Component       ││  │
│  │  └────────────────┘   │    └──────────────────────┘│  │
│  │                       │                              │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │         React Hooks & State                  │  │  │
│  │  │  - useState for form data                    │  │  │
│  │  │  - useEffect for data fetching               │  │  │
│  │  │  - useNavigate for routing                   │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            Services & Utilities Layer             │  │
│  │                                                     │  │
│  │  ┌──────────────────┐  ┌────────────────────────┐ │  │
│  │  │   api.js         │  │  fingerprint.js        │ │  │
│  │  │ - markAttendance │  │ - getGeolocation()     │ │  │
│  │  │ - getProfile     │  │ - generateFingerprint()│ │  │
│  │  │ - getAttendance  │  │ - getSessionFromUrl()  │ │  │
│  │  └──────────────────┘  └────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │        Styling & UI                               │  │
│  │  - Tailwind CSS (tailwind.config.js)              │  │
│  │  - Custom primary color palette                   │  │
│  │  - Responsive design utilities                    │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                   (HTTPS/CORS)
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Express Backend (Port 5000)                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         API Endpoints                              │  │
│  │  - POST /mark-attendance                           │  │
│  │  - GET /student-attendance/:rollNo                 │  │
│  │  - GET /student-profile/:rollNo                    │  │
│  │  - POST /api/validate-session                      │  │
│  │  - POST /api/consistent-hash                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Business Logic                             │  │
│  │  - Session validation                              │  │
│  │  - Geolocation verification                        │  │
│  │  - Device fingerprinting                           │  │
│  │  - Attendance recording                            │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Database Layer                             │  │
│  │  - Student profiles                                │  │
│  │  - Attendance records                              │  │
│  │  - Sessions                                        │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                   (Mongoose ODM)
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              MongoDB Database                              │
│                                                             │
│  Collections:                                              │
│  - users                                                   │
│  - studentprofiles                                         │
│  - attendances                                             │
│  - adminsessions                                           │
│  - qrlogs                                                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App (React Router)
├── /
│   └── AttendanceForm
│       ├── Form Inputs
│       ├── Geolocation
│       ├── Device Fingerprinting
│       └── API Calls (markAttendance)
│
└── /dashboard?rollNo=XXX
    └── StudentDashboard
        ├── Header
        │   ├── Sidebar Toggle
        │   └── Profile Section
        ├── Sidebar
        │   ├── Navigation Links
        │   └── Logout Button
        ├── Main Content
        │   ├── Welcome Banner
        │   ├── Quick Stats Cards (4)
        │   │   ├── Attendance Card
        │   │   ├── CGPA Card
        │   │   ├── Student ID Card
        │   │   └── Status Card
        │   ├── Personal Information Section
        │   ├── Attendance History
        │   ├── Attendance Distribution Chart
        │   └── Quick Actions
        └── API Calls (getProfile, getAttendance)
```

## State Management Flow

```
Component State (useState)
│
├── AttendanceForm
│   ├── formData
│   │   ├── name
│   │   ├── universityRollNo
│   │   ├── section
│   │   └── classRollNo
│   ├── status (string)
│   ├── loading (boolean)
│   ├── rollInputValue (string)
│   └── sessionId (string from URL)
│
└── StudentDashboard
    ├── sidebarOpen (boolean)
    ├── studentData (object)
    │   ├── name
    │   ├── email
    │   ├── cgpa
    │   ├── department
    │   └── ... profile info
    ├── attendanceData (object)
    │   ├── percentage
    │   ├── presentDays
    │   ├── absentDays
    │   └── history (array)
    └── loading (boolean)
```

## API Communication

```
Frontend Request
    ↓
POST /mark-attendance
{
  name: "Student Name",
  universityRollNo: "12345",
  section: "A",
  classRollNo: "10",
  location: { lat: 30.2679, lng: 77.9918 },
  deviceFingerprint: "hash_value",
  sessionId: "qr_session_id"
}
    ↓
Backend Processing
    ↓
Response
{
  status: "success",
  message: "Attendance marked successfully"
}
    ↓
Frontend Navigation to Dashboard
```

## Build Process

```
Development (npm run dev)
    ↓
Vite Dev Server (Port 5173)
    ├── Fast HMR (Hot Module Replacement)
    ├── JSX → React Components
    ├── Tailwind CSS Processing
    └── Real-time Updates

Production Build (npm run build)
    ↓
Vite Build Process
    ├── Bundle JS/CSS
    ├── Minification
    ├── Tree Shaking
    ├── Code Splitting
    └── Output: dist/
        ├── index.html
        ├── assets/index-*.js (minified)
        └── assets/index-*.css (minified)
            ↓
Backend Serving
    ├── Express serves dist/ folder
    ├── SPA fallback to index.html
    └── Available on http://localhost:5000
```

## Technology Stack Diagram

```
┌────────────────────────────────────────────────────────┐
│                 FRONTEND LAYER                         │
├────────────────────────────────────────────────────────┤
│  React 19.2.6  →  React Router 7.15.0  →  Tailwind   │
│       ↓              ↓                        ↓         │
│  Components    Page Navigation         Styling        │
│  State Mgmt    Route Matching          Layout         │
│  Hooks         Dynamic Routes          Responsive    │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│                BUILD & DEV TOOLS                       │
├────────────────────────────────────────────────────────┤
│  Vite 8.0.12  ←→  PostCSS 8.5.14  ←→  ESLint 10.3.0  │
│       ↓                 ↓                    ↓         │
│  Build Tool      CSS Processing     Code Quality     │
│  HMR/Dev        Autoprefixer        Error Checking   │
│  Optimization    Tailwind Plugin     Best Practices  │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│              SUPPORTING LIBRARIES                      │
├────────────────────────────────────────────────────────┤
│  Axios 1.16.0  →  Chart.js 4.5.1  →  React Icons     │
│       ↓                 ↓                   ↓          │
│  HTTP Client   Visualization        Icon Library     │
│  API Calls     Charts/Graphs        UI Elements      │
│  Interceptors  Analytics           Icon Sets        │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│               BACKEND & DATABASE                       │
├────────────────────────────────────────────────────────┤
│  Express.js  ←→  MongoDB  ←→  Mongoose                │
│       ↓              ↓            ↓                   │
│  API Routes   NoSQL Data   Schema Definition         │
│  Middleware   Storage      Data Validation           │
│  CORS Config  Collections  Relationships             │
└────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────┐
│         Development Environment          │
├──────────────────────────────────────────┤
│  Frontend Dev Server (localhost:5173)    │
│  Backend Server (localhost:5000)         │
│  MongoDB Local Instance                  │
└──────────────────────────────────────────┘
           ↓ (npm run build)
┌──────────────────────────────────────────┐
│         Production Build                 │
├──────────────────────────────────────────┤
│  frontend/dist/ (optimized React app)    │
│  backend/server.js (serves dist/)        │
└──────────────────────────────────────────┘
           ↓ (Deploy)
┌──────────────────────────────────────────┐
│         Production Server                │
├──────────────────────────────────────────┤
│  Express on port 5000                    │
│  Serves React build + API endpoints      │
│  Connected to Production MongoDB         │
└──────────────────────────────────────────┘
```

## Security & Performance

```
Frontend Security:
  ├── React DevTools disabled in production
  ├── Content Security Policy (CSP) headers
  ├── XSS protection via React's automatic escaping
  └── CORS configuration for API calls

Frontend Performance:
  ├── Vite fast builds with esbuild
  ├── Code splitting
  ├── Tree shaking for unused code
  ├── Minified CSS & JS
  └── Lazy loading routes ready

Backend Security:
  ├── Rate limiting on QR generation
  ├── Session validation
  ├── Device fingerprinting verification
  ├── Geolocation bounds checking
  └── CORS whitelist configuration
```

---

This architecture provides a modern, scalable foundation for the QR-Based Attendance System with clear separation of concerns, easy maintainability, and room for future enhancements.
