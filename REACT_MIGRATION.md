# React Migration Guide - QR-Based Attendance System

## Overview
The frontend has been successfully migrated from basic HTML/Vanilla JS to a modern React application with Vite, React Router, Tailwind CSS, and Chart.js.

## Project Structure

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── AttendanceForm.jsx      # Main attendance marking form
│   │   └── StudentDashboard.jsx    # Student dashboard with charts
│   ├── services/
│   │   └── api.js                  # Centralized API calls with Axios
│   ├── utils/
│   │   └── fingerprint.js          # Device fingerprinting & location utilities
│   ├── App.jsx                     # Main app with routing
│   ├── App.css                     # App styles
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Tailwind CSS directives
├── package.json
├── tailwind.config.js              # Tailwind configuration
├── postcss.config.js               # PostCSS configuration
├── vite.config.js                  # Vite configuration
└── dist/                           # Production build (created after npm run build)
```

## Key Features

### 1. **Components**

#### AttendanceForm Component
- Converts HTML form to React component
- Manages form state with `useState`
- Handles session validation from URL parameters
- Integrates geolocation and device fingerprinting
- Shows real-time status messages
- Includes "Check Dashboard" feature with roll number input

**Key Functions:**
- `handleInputChange()` - Form field updates
- `handleSubmit()` - Form submission with API integration
- `checkAttendanceAndLoadDashboard()` - Navigate to dashboard

#### StudentDashboard Component
- Displays student attendance information
- Shows personal and academic information
- Responsive sidebar navigation (mobile-friendly)
- Charts for attendance distribution using Chart.js
- Quick stats cards showing attendance %, CGPA, student ID, status
- Attendance history visualization with color-coded days

**Key Features:**
- Mobile-responsive sidebar with overlay
- Collapsible navigation menu
- Real-time data fetching from backend
- Profile image generation using ui-avatars
- Attendance history with present/absent/holiday indicators

### 2. **Services & Utilities**

#### API Service (`services/api.js`)
Centralized Axios instance with helper functions:
- `markAttendance()` - Submit attendance
- `getStudentAttendance()` - Fetch attendance data
- `getStudentProfile()` - Fetch student info
- `validateSession()` - Validate QR session
- `generateConsistentHash()` - Generate device fingerprint hash

#### Fingerprint Utilities (`utils/fingerprint.js`)
Device fingerprinting functions:
- `generateDeviceFingerprint()` - Creates unique device identifier
- `getGeolocation()` - Gets user location with error handling
- `getSessionIdFromUrl()` - Extracts QR session from URL
- `getRollNoFromUrl()` - Extracts roll number from URL

### 3. **Routing**

React Router setup with navigation:
- `/` - AttendanceForm (main page)
- `/dashboard?rollNo=XXX` - StudentDashboard with roll number parameter
- `*` - Catch-all redirects to home

### 4. **Styling**

#### Tailwind CSS Configuration
- Custom primary color palette (blue shades)
- Responsive breakpoints
- Custom theme extensions
- Utility-first approach

**Color Palette:**
```
primary-50: #f0f9ff
primary-100: #e0f2fe
primary-200: #bae6fd
primary-300: #7dd3fc
primary-400: #38bdf8
primary-500: #0ea5e9
primary-600: #0284c7
primary-700: #0369a1
primary-800: #075985
primary-900: #0c4a6e
```

### 5. **State Management**
Uses React's built-in `useState` hook for component state:
- Form data in AttendanceForm
- Loading states
- Modal/sidebar toggles
- Status messages

## Installation & Setup

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
# Runs on http://localhost:5173/
```

### Production Build
```bash
npm run build
# Creates optimized build in dist/ folder
```

### Preview Production Build
```bash
npm run preview
```

## Dependencies

### Production Dependencies
```json
{
  "axios": "^1.16.0",                    // HTTP client
  "chart.js": "^4.5.1",                  // Chart library
  "react": "^19.2.6",                    // React framework
  "react-dom": "^19.2.6",                // React DOM rendering
  "react-icons": "^5.6.0",               // Icon library
  "react-router-dom": "^7.15.0"          // Routing
}
```

### Development Dependencies
```json
{
  "@tailwindcss/postcss": "^4.3.0",     // Tailwind CSS
  "tailwindcss": "^3.4.1",               // Tailwind utilities
  "vite": "^8.0.12",                     // Build tool
  "postcss": "^8.5.14",                  // CSS processor
  "@vitejs/plugin-react": "^6.0.1",      // Vite React plugin
  "autoprefixer": "^10.5.0"              // CSS autoprefixer
}
```

## Backend Integration

### Server Configuration
The backend (`backend/server.js`) has been updated to:

1. **Serve React Build Files**
   ```javascript
   app.use(express.static(path.join(__dirname, '../frontend/dist')));
   ```

2. **Handle SPA Routing**
   - Added catch-all route that serves `index.html` for all non-API routes
   - Enables client-side routing to work properly

3. **CORS Headers**
   - Configured for frontend communication
   - CSP headers updated for Tailwind and other CDN resources

### API Endpoints Used
- `POST /mark-attendance` - Submit attendance
- `GET /student-attendance/:rollNo` - Get attendance data
- `GET /student-profile/:rollNo` - Get student info
- `POST /api/validate-session` - Validate QR session
- `POST /api/consistent-hash` - Generate fingerprint hash

## Migration Notes

### What Changed
1. **HTML to JSX** - All HTML pages converted to React components
2. **Vanilla JS to React** - Event handlers converted to React handlers
3. **Global State** - Form state managed with React hooks
4. **Styling** - Moved from inline CSS to Tailwind utility classes
5. **Routing** - Added React Router for client-side navigation
6. **Build Process** - Switched from serving static files to Vite + React

### Removed Files (from frontend/)
- `index.html` - Replaced by React components
- `dashboard.html` - Now StudentDashboard.jsx
- `admin-dashboard.html` - To be converted
- `login.html` - To be converted
- `qr-scanner.html` - To be converted
- `script.js` - Logic moved to components and utilities
- `public/` - Static assets moved to dist/

### Backward Compatibility
- All API endpoints remain unchanged
- Backend continues to work with existing database
- QR code generation still works the same way

## Development Workflow

### Adding a New Component
1. Create file in `src/components/ComponentName.jsx`
2. Import React hooks as needed
3. Add route in `App.jsx` if it's a page
4. Use Tailwind classes for styling

### Adding API Calls
1. Add function to `src/services/api.js`
2. Import and use in components with try-catch
3. Handle loading and error states

### Styling
- Use Tailwind utility classes directly in JSX
- Reference `tailwind.config.js` for custom colors
- No CSS files needed for standard styling

## Common Tasks

### Running in Development
```bash
# Terminal 1: Frontend dev server
cd frontend
npm run dev

# Terminal 2: Backend server
cd backend
npm start
```

### Building for Production
```bash
cd frontend
npm run build
cd ..
# Deploy dist/ folder to production
```

### Deploying to Backend Server
1. Build frontend: `npm run build`
2. Backend serves from `frontend/dist/`
3. No changes needed to backend server config

### Debugging
- React DevTools browser extension recommended
- Check browser console for client-side errors
- Check terminal for server-side errors
- Network tab for API calls

## Troubleshooting

### Issue: "Module not found" errors
**Solution:** Run `npm install` to ensure all dependencies are installed

### Issue: Tailwind styles not applying
**Solution:** Ensure `tailwind.config.js` includes correct content paths and CSS includes `@tailwind` directives

### Issue: Routes not working
**Solution:** Verify `React Router` is wrapping the app in `App.jsx`

### Issue: API calls failing
**Solution:** Check backend CORS configuration and ensure backend server is running on port 5000

## Future Enhancements

1. **Admin Dashboard** - Convert `admin-dashboard.html` to React
2. **Login Page** - Implement authentication component
3. **QR Scanner** - Integrate QR scanning library (react-qr-reader)
4. **State Management** - Consider Redux/Zustand for complex state
5. **Testing** - Add Jest and React Testing Library
6. **Error Boundaries** - Add error handling component
7. **Performance** - Code splitting and lazy loading routes
8. **Animations** - Add Framer Motion for smooth transitions

## Support

For issues or questions:
1. Check the development console for error messages
2. Verify all dependencies are installed
3. Ensure backend server is running
4. Review API response in Network tab

---

**Last Updated:** May 12, 2026
**React Version:** 19.2.6
**Vite Version:** 8.0.12
**Tailwind Version:** 3.4.1
