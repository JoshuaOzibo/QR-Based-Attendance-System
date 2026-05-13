# Quick Start Guide - React Frontend

## Starting the Development Environment

### Prerequisites
- Node.js installed
- MongoDB running (for backend)
- Backend server configured

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Frontend Dev Server
```bash
npm run dev
```
The app will be available at: **http://localhost:5173/**

### Step 3: Start Backend Server (in another terminal)
```bash
cd backend
npm start
# Backend runs on http://localhost:5000
```

## Features Overview

### 1. Attendance Form Page (`/`)
- Enter student details (Name, Roll No, Section, Class Roll No)
- Automatically detects location and device fingerprint
- Validates QR session from URL
- Shows confirmation message
- Navigate to dashboard after submission

**URL with QR Session:**
```
http://localhost:5173/?sessionId=YOUR_SESSION_ID
```

### 2. Student Dashboard (`/dashboard?rollNo=XXXXX`)
- View attendance percentage
- See personal information
- Track academic status (CGPA, student ID)
- View attendance history with calendar
- Charts showing attendance distribution
- Download certificates (coming soon)

## Building for Production

### Build Frontend
```bash
cd frontend
npm run build
```
This creates an optimized build in the `dist/` folder.

### Running Production Build Locally
```bash
npm run preview
```

### Deploying to Server
1. Build the frontend: `npm run build`
2. Backend automatically serves from `frontend/dist/`
3. No additional configuration needed

## Important URLs

| Purpose | URL |
|---------|-----|
| Frontend Dev | http://localhost:5173/ |
| Frontend Prod | http://localhost:5000/ |
| Backend API | http://localhost:5000/api/* |
| QR Form | http://localhost:5173/?sessionId=ABC |
| Dashboard | http://localhost:5173/dashboard?rollNo=12345 |

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Component Quick Reference

| Component | Path | Purpose |
|-----------|------|---------|
| AttendanceForm | `src/components/AttendanceForm.jsx` | Main attendance form |
| StudentDashboard | `src/components/StudentDashboard.jsx` | Dashboard view |
| API Service | `src/services/api.js` | API calls |
| Utilities | `src/utils/fingerprint.js` | Device fingerprinting |

## Tips & Tricks

### 1. Testing Attendance Form
```
- Ensure backend is running
- QR Session: Add ?sessionId=test_session to URL
- Use current location when prompted
- Check browser console for errors
```

### 2. Testing Dashboard
```
- Go to: http://localhost:5173/dashboard?rollNo=12345
- Replace 12345 with actual roll number in database
- Sidebar responsive on mobile (width < 768px)
```

### 3. Hot Module Replacement (HMR)
Changes are automatically reflected in browser - no refresh needed!

### 4. Browser DevTools
- React DevTools extension recommended
- Console shows helpful warnings and errors
- Network tab shows all API calls

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Cannot GET /` | Check frontend dev server is running on 5173 |
| `CORS error` | Verify backend CORS config allows 5173 |
| `Styles not loading` | Run `npm install` to ensure Tailwind is installed |
| `API fails` | Check backend is running on 5000 and MONGO_URI is set |
| `Location permission denied` | Browser will use device fingerprint fallback |

## Next Steps

1. ✅ Frontend running on development server
2. ✅ Backend integrated and serving API
3. ⏳ Add admin dashboard component
4. ⏳ Add QR scanner component
5. ⏳ Add authentication/login
6. ⏳ Deploy to production

## Getting Help

Check these files for more information:
- `REACT_MIGRATION.md` - Detailed migration guide
- `frontend/package.json` - Dependencies and scripts
- `tailwind.config.js` - Tailwind configuration
- `backend/server.js` - API endpoints

---

**Happy Coding! 🚀**
