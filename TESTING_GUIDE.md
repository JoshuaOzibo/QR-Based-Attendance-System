# Testing Guide - React Frontend

## Setup Testing Environment

### Prerequisites
- Node.js installed
- React dev server running on http://localhost:5173/
- Backend server running on http://localhost:5000/
- MongoDB running with test data

## Manual Testing Checklist

### 1. AttendanceForm Component Testing

#### Test 1.1: Form Rendering
- [ ] Open http://localhost:5173/
- [ ] Verify form displays with all fields:
  - [ ] Full Name input
  - [ ] University Roll No input
  - [ ] Section input
  - [ ] Class Roll No input
  - [ ] Submit button
- [ ] Verify style consistency with Tailwind CSS
- [ ] Verify responsive design (test on mobile view)

#### Test 1.2: Form Validation
- [ ] Leave all fields empty and click Submit
  - Expected: "Please fill all fields" error message
- [ ] Fill all fields and submit
  - Expected: Form submission attempt

#### Test 1.3: QR Session Validation
- [ ] Test without sessionId in URL
  - Expected: "Please scan the QR code first" error
- [ ] Test with valid sessionId parameter
  - Expected: Form accepts submission
- [ ] Test URL: `http://localhost:5173/?sessionId=test123`

#### Test 1.4: Geolocation Feature
- [ ] Click Submit with all fields filled
- [ ] Browser should prompt for location permission
  - Allow: GPS coordinates should be captured
  - Deny: Should show "Location error" message

#### Test 1.5: Device Fingerprinting
- [ ] Submit attendance with location allowed
- [ ] Check browser console for fingerprint generation
- [ ] Verify fingerprint is cached in localStorage
  - Open DevTools → Application → LocalStorage
  - Should see entry like `fingerprint-2026-05-12`

#### Test 1.6: Status Messages
Test different scenarios:
- [ ] "Please fill all fields" (missing inputs)
- [ ] "Please scan the QR code first" (no sessionId)
- [ ] "You've already marked attendance today" (duplicate)
- [ ] "Attendance marked successfully!" (success)

#### Test 1.7: Dashboard Navigation
- [ ] After successful attendance, redirected to dashboard
- [ ] Or use "Check Your Attendance" section:
  - [ ] Enter valid roll number
  - [ ] Click "View Dashboard"
  - [ ] Should navigate to `/dashboard?rollNo=XXXXX`

### 2. StudentDashboard Component Testing

#### Test 2.1: Dashboard Loading
- [ ] Navigate to `http://localhost:5173/dashboard?rollNo=12345`
- [ ] Verify page shows loading spinner initially
- [ ] Data loads and displays after loading completes

#### Test 2.2: Layout & Navigation
- [ ] Verify sidebar displays correctly
  - [ ] Logo and title visible
  - [ ] Navigation links clickable
  - [ ] Logout button present
- [ ] Verify header displays correctly
  - [ ] Title "Student Dashboard" visible
  - [ ] User profile picture shows
  - [ ] User name displays

#### Test 2.3: Quick Stats Cards
Verify all 4 cards display:
- [ ] Attendance Card
  - [ ] Shows percentage (e.g., 85%)
  - [ ] Progress bar fills to percentage
  - [ ] Shows "Minimum required: 75%"
- [ ] CGPA Card
  - [ ] Shows CGPA/4.0 (e.g., 3.5/4.0)
  - [ ] Progress bar shows proportional width
- [ ] Student ID Card
  - [ ] Shows roll number
  - [ ] Shows registration number
- [ ] Status Card
  - [ ] Shows academic status (Active)
  - [ ] Shows batch information

#### Test 2.4: Personal Information Section
- [ ] Displays student details:
  - [ ] Full Name
  - [ ] Email
  - [ ] Contact Number
  - [ ] Date of Birth
  - [ ] Gender
  - [ ] Address

#### Test 2.5: Attendance History
- [ ] Shows calendar view of attendance
  - [ ] Green (P) for Present days
  - [ ] Red (A) for Absent days
  - [ ] Gray for Holidays/NA
- [ ] Shows statistics:
  - [ ] Present count
  - [ ] Absent count
  - [ ] Total days count

#### Test 2.6: Charts
- [ ] Doughnut chart displays:
  - [ ] Green for Present
  - [ ] Red for Absent
  - [ ] Proper percentages
  - [ ] Legend shows "Present" and "Absent"

#### Test 2.7: Mobile Responsiveness
- [ ] On mobile view (width < 768px):
  - [ ] Sidebar hides by default
  - [ ] Menu toggle button appears (hamburger icon)
  - [ ] Click toggle to show/hide sidebar
  - [ ] Content reflows properly
- [ ] On tablet/desktop:
  - [ ] Sidebar always visible
  - [ ] Menu toggle button hidden
  - [ ] Content uses full width efficiently

#### Test 2.8: Logout Functionality
- [ ] Click Logout button
- [ ] Should redirect to home page (`/`)

### 3. Routing Tests

#### Test 3.1: Navigation Flow
- [ ] `http://localhost:5173/` → AttendanceForm loads
- [ ] `http://localhost:5173/dashboard` → Dashboard loads with error (no rollNo)
- [ ] `http://localhost:5173/dashboard?rollNo=12345` → Dashboard loads correctly
- [ ] `http://localhost:5173/invalid-route` → Redirects to home

#### Test 3.2: Programmatic Navigation
- [ ] Form submit with valid data → redirects to dashboard
- [ ] Dashboard logout button → redirects to home

### 4. API Integration Tests

#### Test 4.1: Mark Attendance API
```javascript
// POST /mark-attendance
{
  "name": "Test Student",
  "universityRollNo": "12345",
  "section": "A",
  "classRollNo": "10",
  "location": {"lat": 30.2679, "lng": 77.9918},
  "deviceFingerprint": "fingerprint_hash",
  "sessionId": "qr_session_id"
}
```
- [ ] Send request with valid data → Should succeed
- [ ] Send request twice with same data → "Already marked today" error
- [ ] Missing fields → Validation error

#### Test 4.2: Get Student Profile API
```javascript
// GET /student-profile/12345
```
- [ ] Valid roll number → Returns student data
- [ ] Invalid roll number → Returns 404 error

#### Test 4.3: Get Attendance API
```javascript
// GET /student-attendance/12345
```
- [ ] Valid roll number → Returns attendance data
- [ ] Invalid roll number → Returns 404 error

#### Test 4.4: Validate Session API
```javascript
// POST /api/validate-session
{"sessionId": "qr_session_id"}
```
- [ ] Valid session → Returns {valid: true}
- [ ] Invalid session → Returns {valid: false}

#### Test 4.5: Generate Hash API
```javascript
// POST /api/consistent-hash
{"input": "device_fingerprint_data"}
```
- [ ] Send valid input → Returns fingerprint hash
- [ ] Check response includes fingerprint field

### 5. Error Handling Tests

#### Test 5.1: Network Errors
- [ ] Turn off backend server
- [ ] Try to submit attendance
  - Expected: Error message displayed
  - Expected: No crash or blank page
- [ ] Restart backend server

#### Test 5.2: Missing Environment Variables
- [ ] Check MongoDB connection
  - If not running, backend should fail to connect
  - Frontend should show error when API called

#### Test 5.3: Invalid Data
- [ ] Submit form with special characters
  - Expected: Should be handled properly
- [ ] Submit very long names
  - Expected: Should handle gracefully

### 6. Performance Tests

#### Test 6.1: Page Load Time
- [ ] Open DevTools → Network tab
- [ ] Load `http://localhost:5173/`
- [ ] Check load time (target: < 2 seconds)

#### Test 6.2: Dashboard Load Time
- [ ] Navigate to dashboard
- [ ] Check API response times
  - Student profile API: < 500ms
  - Attendance API: < 500ms

#### Test 6.3: Build Size
```bash
cd frontend
npm run build
# Check dist/ folder size
```
- [ ] index.html: < 1KB
- [ ] index-*.css: < 20KB (gzipped < 5KB)
- [ ] index-*.js: < 500KB (gzipped < 150KB)

### 7. Browser Compatibility Tests

Test on different browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Verify on each:
- [ ] Layout displays correctly
- [ ] Forms work properly
- [ ] Charts render
- [ ] Navigation works
- [ ] No console errors

### 8. Accessibility Tests

- [ ] Can navigate using Tab key
- [ ] Forms can be submitted with keyboard
- [ ] Screen reader can read labels
- [ ] Color contrast meets WCAG standards
- [ ] Images have alt text

### 9. Local Storage Tests

In browser DevTools (Application → LocalStorage):
- [ ] After first attendance: `fingerprint-[DATE]` created
- [ ] Fingerprint value is consistent
- [ ] Value is used on subsequent submissions

### 10. Tailwind CSS Tests

- [ ] Colors match primary palette
- [ ] Responsive classes work (sm:, md:, lg:)
- [ ] Hover effects work on buttons
- [ ] Focus states work on inputs
- [ ] Animations work (loading spinner)

## Automated Testing (Optional)

### Install Testing Libraries
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest @vitejs/plugin-react
```

### Example Test File
```javascript
// src/components/__tests__/AttendanceForm.test.jsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AttendanceForm from '../AttendanceForm';

describe('AttendanceForm', () => {
  test('renders form with all fields', () => {
    render(
      <BrowserRouter>
        <AttendanceForm />
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/University Roll No/i)).toBeInTheDocument();
  });

  test('shows error when form submitted empty', async () => {
    render(
      <BrowserRouter>
        <AttendanceForm />
      </BrowserRouter>
    );
    
    const submitButton = screen.getByRole('button', {name: /Submit/i});
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/Please fill all fields/i)).toBeInTheDocument();
  });
});
```

## Test Report Template

### Test Execution Report

**Date:** ________________
**Tester:** ________________
**Build Version:** ________________

#### Summary
- Total Tests: [ ]
- Passed: [ ]
- Failed: [ ]
- Issues: [ ]

#### Issues Found
| Issue | Severity | Steps to Reproduce | Expected | Actual | Status |
|-------|----------|-------------------|----------|--------|--------|
| | | | | | |

#### Performance Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Page Load Time | < 2s | | |
| API Response | < 500ms | | |
| Build Size | < 500KB | | |
| Lighthouse Score | > 90 | | |

#### Sign-off
- [ ] All critical tests passed
- [ ] No critical bugs
- [ ] Ready for deployment

**Tester Signature:** ________________ **Date:** ________________

---

## Debugging Tips

### Browser DevTools
```javascript
// React DevTools
1. Install React DevTools browser extension
2. Open DevTools, look for React tab
3. Inspect components, check state, props

// Console Debugging
console.log("Variable:", variable);
console.table(data);
console.error("Error:", error);

// Network Tab
1. Check all API requests
2. Verify response status (200, 400, 500)
3. Check response payload
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| White blank page | Check browser console for errors |
| Styles not applied | Verify Tailwind classes are correct |
| API calls fail | Check backend is running, CORS config |
| Forms not submitting | Check browser console, geolocation permission |
| Dashboard shows no data | Verify roll number exists in database |
| Charts not rendering | Check chart.js installation, data format |

---

**Happy Testing! 🧪**
