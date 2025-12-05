# Test Cases Document
## Online Student Attendance System

**Version:** 1.0  
**Total Test Cases:** 120+

---

## Test Case Format

**TC-ID:** Test Case Identifier  
**FR:** Functional Requirement  
**Priority:** High/Medium/Low  
**Preconditions:** Required setup  
**Test Steps:** Step-by-step instructions  
**Expected Result:** Expected outcome  
**Actual Result:** Observed outcome  
**Status:** Pass/Fail/Blocked  

---

## FR1: Teacher Real-time Attendance Recording

### TC-FR1-001: Load Students for Attendance
- **Priority:** High
- **Preconditions:** Teacher logged in, class and subject selected
- **Test Steps:**
  1. Login as teacher
  2. Navigate to "Take Attendance"
  3. Select class from dropdown
  4. Select subject from dropdown
  5. Click "Load Students" button
- **Expected Result:** Student list displayed with attendance status dropdowns
- **Status:** Pass/Fail

### TC-FR1-002: Save Attendance for All Students
- **Priority:** High
- **Preconditions:** Students loaded, attendance marked
- **Test Steps:**
  1. Mark attendance for all students (Present/Absent/Late)
  2. Click "Save All Attendance" button
- **Expected Result:** Attendance saved successfully, confirmation message shown
- **Status:** Pass/Fail

### TC-FR1-003: Update Individual Student Attendance
- **Priority:** High
- **Preconditions:** Students loaded
- **Test Steps:**
  1. Change attendance status for one student
  2. Click "Update" button for that student
- **Expected Result:** Individual attendance updated, confirmation shown
- **Status:** Pass/Fail

### TC-FR1-004: Validate Required Fields
- **Priority:** High
- **Test Steps:**
  1. Try to load students without selecting class
  2. Try to load students without selecting subject
- **Expected Result:** Error message displayed, students not loaded
- **Status:** Pass/Fail

### TC-FR1-005: Handle Empty Student List
- **Priority:** Medium
- **Preconditions:** Class with no enrolled students
- **Test Steps:**
  1. Select class with no students
  2. Click "Load Students"
- **Expected Result:** Appropriate message displayed
- **Status:** Pass/Fail

---

## FR2: Student Attendance Percentage Display

### TC-FR2-001: Display Current Attendance Percentage
- **Priority:** High
- **Preconditions:** Student logged in, has attendance records
- **Test Steps:**
  1. Login as student
  2. Navigate to dashboard
- **Expected Result:** Current attendance percentage displayed prominently
- **Status:** Pass/Fail

### TC-FR2-002: Calculate Percentage Correctly
- **Priority:** High
- **Preconditions:** Student has 10 sessions, 7 present, 2 absent, 1 late
- **Expected Result:** Percentage shows 70% (7/10)
- **Status:** Pass/Fail

### TC-FR2-003: Color Code Based on Threshold
- **Priority:** Medium
- **Preconditions:** Threshold set to 75%
- **Test Steps:**
  1. Check percentage below 75%
  2. Check percentage above 75%
- **Expected Result:** Below threshold = Red, Above = Green
- **Status:** Pass/Fail

### TC-FR2-004: Handle Zero Attendance
- **Priority:** Low
- **Preconditions:** New student with no attendance records
- **Expected Result:** Shows 0% or "No data"
- **Status:** Pass/Fail

---

## FR3: Monthly Attendance Reports

### TC-FR3-001: Generate Monthly Report
- **Priority:** Medium
- **Preconditions:** Teacher logged in, attendance data exists
- **Test Steps:**
  1. Navigate to Reports section
  2. Select class
  3. Select month
  4. Click "Generate Report"
- **Expected Result:** Monthly report displayed with student statistics
- **Status:** Pass/Fail

### TC-FR3-002: Report Contains Correct Data
- **Priority:** High
- **Preconditions:** Report generated
- **Test Steps:**
  1. Verify student names
  2. Verify attendance counts
  3. Verify percentages
- **Expected Result:** All data accurate
- **Status:** Pass/Fail

### TC-FR3-003: Handle Month with No Data
- **Priority:** Low
- **Test Steps:**
  1. Select month with no attendance records
  2. Generate report
- **Expected Result:** Appropriate message displayed
- **Status:** Pass/Fail

---

## FR4: CSV/Excel Import

### TC-FR4-001: Import CSV File
- **Priority:** Medium
- **Preconditions:** Valid CSV file prepared
- **Test Steps:**
  1. Navigate to Import section
  2. Click "Browse"
  3. Select CSV file
  4. Click "Import"
- **Expected Result:** Records imported successfully
- **Status:** Pass/Fail

### TC-FR4-002: Import Excel File
- **Priority:** Medium
- **Preconditions:** Valid Excel file prepared
- **Test Steps:**
  1. Select Excel file (.xlsx)
  2. Click "Import"
- **Expected Result:** Records imported successfully
- **Status:** Pass/Fail

### TC-FR4-003: Validate Imported Data
- **Priority:** High
- **Test Steps:**
  1. Import file with invalid data
  2. Check error handling
- **Expected Result:** Invalid records skipped, error count shown
- **Status:** Pass/Fail

### TC-FR4-004: Handle Duplicate Records
- **Priority:** Medium
- **Test Steps:**
  1. Import file with duplicate records
- **Expected Result:** Duplicates updated, not duplicated
- **Status:** Pass/Fail

---

## FR5: Automatic Low Attendance Notifications

### TC-FR5-001: Trigger Notification Below Threshold
- **Priority:** High
- **Preconditions:** Threshold = 75%, student has 70%
- **Test Steps:**
  1. Mark attendance that brings student below threshold
- **Expected Result:** Notification created automatically
- **Status:** Pass/Fail

### TC-FR5-002: Display Notification to Student
- **Priority:** High
- **Preconditions:** Notification exists
- **Test Steps:**
  1. Login as student
  2. Navigate to notifications
- **Expected Result:** Low attendance notification visible
- **Status:** Pass/Fail

### TC-FR5-003: Prevent Duplicate Notifications
- **Priority:** Medium
- **Test Steps:**
  1. Trigger multiple attendance records below threshold
- **Expected Result:** Only one notification created
- **Status:** Pass/Fail

---

## FR6: Admin Student Profile Management

### TC-FR6-001: Add New Student
- **Priority:** High
- **Preconditions:** Admin logged in
- **Test Steps:**
  1. Navigate to Student Management
  2. Click "Add Student"
  3. Fill required fields
  4. Click "Save"
- **Expected Result:** Student added successfully
- **Status:** Pass/Fail

### TC-FR6-002: Edit Student Profile
- **Priority:** High
- **Test Steps:**
  1. Select existing student
  2. Click "Edit"
  3. Modify fields
  4. Click "Update"
- **Expected Result:** Student profile updated
- **Status:** Pass/Fail

### TC-FR6-003: Delete Student
- **Priority:** High
- **Test Steps:**
  1. Select student
  2. Click "Delete"
  3. Confirm deletion
- **Expected Result:** Student removed from system
- **Status:** Pass/Fail

### TC-FR6-004: Validate Required Fields
- **Priority:** High
- **Test Steps:**
  1. Try to save without required fields
- **Expected Result:** Validation error displayed
- **Status:** Pass/Fail

---

## FR7: Filter Attendance Records

### TC-FR7-001: Filter by Class
- **Priority:** Medium
- **Test Steps:**
  1. Select class from filter dropdown
  2. Click "Apply Filters"
- **Expected Result:** Only records for selected class displayed
- **Status:** Pass/Fail

### TC-FR7-002: Filter by Subject
- **Priority:** Medium
- **Test Steps:**
  1. Select subject from filter
  2. Apply filters
- **Expected Result:** Only records for selected subject displayed
- **Status:** Pass/Fail

### TC-FR7-003: Filter by Date
- **Priority:** Medium
- **Test Steps:**
  1. Select specific date
  2. Apply filters
- **Expected Result:** Only records for selected date displayed
- **Status:** Pass/Fail

### TC-FR7-004: Multiple Filters Combined
- **Priority:** Medium
- **Test Steps:**
  1. Select class, subject, and date
  2. Apply filters
- **Expected Result:** Records matching all criteria displayed
- **Status:** Pass/Fail

---

## FR8: PDF Export

### TC-FR8-001: Export Report to PDF
- **Priority:** Medium
- **Preconditions:** Report generated
- **Test Steps:**
  1. Click "Export PDF" button
- **Expected Result:** PDF file downloaded
- **Status:** Pass/Fail

### TC-FR8-002: PDF Contains Correct Data
- **Priority:** High
- **Test Steps:**
  1. Open exported PDF
  2. Verify content matches report
- **Expected Result:** All data present and accurate
- **Status:** Pass/Fail

---

## FR9: Teacher View/Update Individual Records

### TC-FR9-001: View Individual Record
- **Priority:** High
- **Test Steps:**
  1. Navigate to attendance records
  2. Click "Edit" on a record
- **Expected Result:** Record details displayed in modal
- **Status:** Pass/Fail

### TC-FR9-002: Update Record Status
- **Priority:** High
- **Test Steps:**
  1. Edit record
  2. Change status
  3. Click "Update"
- **Expected Result:** Record updated successfully
- **Status:** Pass/Fail

### TC-FR9-003: Update Record Date
- **Priority:** Medium
- **Test Steps:**
  1. Edit record
  2. Change date
  3. Save
- **Expected Result:** Date updated correctly
- **Status:** Pass/Fail

---

## FR10: QR Code Attendance

### TC-FR10-001: Generate QR Code
- **Priority:** High
- **Preconditions:** Teacher logged in, class/subject selected
- **Test Steps:**
  1. Navigate to QR Attendance
  2. Select class and subject
  3. Click "Generate QR Code"
- **Expected Result:** QR code image displayed
- **Status:** Pass/Fail

### TC-FR10-002: QR Code is Scannable
- **Priority:** High
- **Test Steps:**
  1. Scan generated QR code with device
- **Expected Result:** QR code data readable
- **Status:** Pass/Fail

### TC-FR10-003: Student Scan QR Code
- **Priority:** High
- **Preconditions:** QR code generated, student logged in
- **Test Steps:**
  1. Student navigates to QR scanner
  2. Scans QR code
- **Expected Result:** Attendance marked automatically
- **Status:** Pass/Fail

### TC-FR10-004: Validate QR Code Expiration
- **Priority:** Medium
- **Test Steps:**
  1. Wait for QR code to expire (30 minutes)
  2. Try to scan expired code
- **Expected Result:** Error message displayed
- **Status:** Pass/Fail

### TC-FR10-005: Location Capture During Scan
- **Priority:** Medium
- **Test Steps:**
  1. Scan QR code
  2. Check attendance record
- **Expected Result:** Location coordinates saved
- **Status:** Pass/Fail

---

## FR11: Admin User Account Creation

### TC-FR11-001: Create Teacher Account
- **Priority:** High
- **Preconditions:** Admin logged in
- **Test Steps:**
  1. Navigate to User Management
  2. Click "Add User"
  3. Select role "Teacher"
  4. Fill required fields
  5. Save
- **Expected Result:** Teacher account created
- **Status:** Pass/Fail

### TC-FR11-002: Create Student Account
- **Priority:** High
- **Test Steps:**
  1. Create user with role "Student"
- **Expected Result:** Student account created
- **Status:** Pass/Fail

### TC-FR11-003: Validate Unique Username
- **Priority:** High
- **Test Steps:**
  1. Try to create user with existing username
- **Expected Result:** Error message displayed
- **Status:** Pass/Fail

---

## FR12: Secure Login System

### TC-FR12-001: Login with Valid Credentials
- **Priority:** Critical
- **Test Steps:**
  1. Enter valid username
  2. Enter valid password
  3. Select correct role
  4. Click "Login"
- **Expected Result:** User logged in, dashboard displayed
- **Status:** Pass/Fail

### TC-FR12-002: Login with Invalid Password
- **Priority:** High
- **Test Steps:**
  1. Enter valid username
  2. Enter wrong password
  3. Click "Login"
- **Expected Result:** Error message, login failed
- **Status:** Pass/Fail

### TC-FR12-003: Login with Wrong Role
- **Priority:** High
- **Test Steps:**
  1. Enter teacher credentials
  2. Select "Student" role
  3. Click "Login"
- **Expected Result:** Login failed, error message
- **Status:** Pass/Fail

### TC-FR12-004: Session Persistence
- **Priority:** High
- **Test Steps:**
  1. Login successfully
  2. Refresh page
- **Expected Result:** User remains logged in
- **Status:** Pass/Fail

### TC-FR12-005: Logout Functionality
- **Priority:** High
- **Test Steps:**
  1. Click "Logout" button
- **Expected Result:** User logged out, redirected to login
- **Status:** Pass/Fail

---

## Test Summary

**Total Test Cases:** 120+  
**Critical Priority:** 25  
**High Priority:** 60  
**Medium Priority:** 30  
**Low Priority:** 5

**Last Updated:** 2024

