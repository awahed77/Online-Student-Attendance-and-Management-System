# Online Student Attendance System

## What is This Project?

This is a **complete web-based attendance system** that helps schools manage student attendance easily. The system works entirely in a web browser and allows three types of users to manage attendance: Administrators, Teachers, and Students.

---

## What Does This System Do?

### For Teachers:
- ✅ **Take attendance** - Teachers can mark students as Present, Absent, or Late
- ✅ **View attendance records** - See all attendance history with filters
- ✅ **Generate QR codes** - Create QR codes that students can scan to mark their attendance
- ✅ **Import attendance** - Import attendance data from Excel or CSV files
- ✅ **Create reports** - Generate monthly attendance reports and export them as PDF files
- ✅ **Edit records** - Update or delete attendance records if needed

### For Students:
- ✅ **View attendance** - Students can see their own attendance percentage and records
- ✅ **Scan QR codes** - Students can scan QR codes with their phone to mark attendance
- ✅ **See statistics** - View attendance charts and graphs
- ✅ **Get notifications** - Receive warnings when attendance is low

### For Administrators:
- ✅ **Manage students** - Add, edit, or delete student profiles
- ✅ **Create user accounts** - Create accounts for teachers, students, or other admins
- ✅ **View reports** - Generate attendance reports for all classes
- ✅ **System settings** - Set attendance thresholds and other system preferences

---

## Key Features Implemented (All 12 Requirements):

1. ✅ **Real-time Attendance Recording** - Teachers can mark attendance instantly
2. ✅ **Attendance Percentage Display** - Students see their attendance percentage clearly
3. ✅ **Monthly Reports** - Generate detailed monthly attendance reports
4. ✅ **Import from Excel/CSV** - Import attendance data from spreadsheet files
5. ✅ **Low Attendance Notifications** - Students get automatic warnings when attendance is low
6. ✅ **Student Profile Management** - Admins can manage all student information
7. ✅ **Filter Attendance Records** - Filter by class, subject, and date
8. ✅ **Export to PDF** - Download attendance reports as PDF files
9. ✅ **Edit Individual Records** - Teachers can update or delete specific attendance records
10. ✅ **QR Code Attendance** - Modern QR code scanning for quick attendance marking
11. ✅ **User Account Management** - Admins can create and manage all user accounts
12. ✅ **Secure Login System** - Password-protected login for different user roles

---

## How to Use This System:

### Step 1: Open the System
1. Open the file `index.html` in a web browser (like Chrome, Firefox, or Edge)
2. You will see a login page

### Step 2: Login
Use these default accounts to test the system:

**Administrator Account:**
- Username: `admin`
- Password: `admin123`
- Role: Select "Administrator"

**Teacher Account:**
- Username: `teacher1`
- Password: `teacher123`
- Role: Select "Teacher"

**Student Account:**
- Username: `student1`
- Password: `student123`
- Role: Select "Student"

### Step 3: Explore Features
Once logged in, you can:
- Navigate using the sidebar menu
- Try different features like taking attendance, generating QR codes, or viewing reports
- Switch between different user roles to see what each user type can do

---

## What Technologies Were Used?

This project was built using:
- **HTML** - For the webpage structure
- **CSS** - For styling and making it look nice
- **JavaScript** - For all the functionality and interactions
- **LocalStorage** - For storing data in the browser

**Libraries Used:**
- QRCode.js - For generating QR codes
- html5-qrcode - For scanning QR codes with camera
- Chart.js - For displaying attendance statistics as charts
- jsPDF - For creating PDF reports
- SheetJS (xlsx) - For reading Excel files

---

## Important Notes:

- All data is stored in the browser's local storage
- If you clear your browser data, all attendance records will be lost
- This is a demo version - for real school use, it should connect to a database

---

## Project Structure:

```
📁 Project Folder
├── 📄 index.html          (Main page with all dashboards)
├── 📄 present.html        (QR code attendance page)
├── 📁 Css/
│   └── style.css          (All styling)
├── 📁 js/
│   ├── auth.js           (Login and authentication)
│   ├── admin.js          (Admin features)
│   ├── teacher.js        (Teacher features)
│   ├── student.js        (Student features)
│   └── common.js         (Shared functions)
├── 📁 database/          (Database folder)
└── 📁 testing/           (Test files)
```

---

## Summary for Teacher Presentation:

**What I Built:**
A complete online attendance management system that helps schools track student attendance digitally. The system has separate dashboards for administrators, teachers, and students, each with their own features.

**Key Achievements:**
- All 12 required features are working
- Three different user roles with secure login
- QR code scanning for modern attendance tracking
- Excel/CSV import for bulk attendance entry
- PDF report generation
- Real-time notifications for low attendance

**Why It's Useful:**
This system makes attendance tracking faster, more accurate, and easier to manage compared to traditional paper-based methods. Teachers can mark attendance quickly, students can see their records anytime, and administrators can generate detailed reports with just a few clicks.

---

*This project demonstrates skills in web development, user interface design, data management, and building complete functional applications.*




