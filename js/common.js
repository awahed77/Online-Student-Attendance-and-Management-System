// Common utility functions and data management
class CommonSystem {
    constructor() {
        this.attendanceData = this.loadAttendanceData();
        this.classes = this.loadClasses();
        this.subjects = this.loadSubjects();
        this.settings = this.loadSettings();
    }

    // Data management methods
    loadAttendanceData() {
        try {
            const storedData = localStorage.getItem('attendance_data');
            if (storedData) {
                const parsed = JSON.parse(storedData);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch (error) {
            console.error('Error loading attendance data:', error);
            return [];
        }
    }

    saveAttendanceData() {
        try {
            localStorage.setItem('attendance_data', JSON.stringify(this.attendanceData));
            // Also update the instance data
            this.attendanceData = this.loadAttendanceData();
        } catch (error) {
            console.error('Error saving attendance data:', error);
            alert('Error saving attendance data. Please try again.');
        }
    }

    loadClasses() {
        try {
            const defaultClasses = ['Class 01', 'Class 02', 'Class 03', 'Class 04', 'Class 05', 'Class 06'];
            const storedClasses = localStorage.getItem('attendance_classes');
            if (storedClasses) {
                const parsed = JSON.parse(storedClasses);
                return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultClasses;
            }
            return defaultClasses;
        } catch (error) {
            console.error('Error loading classes:', error);
            return ['Class 01', 'Class 02', 'Class 03', 'Class 04', 'Class 05', 'Class 06'];
        }
    }

    saveClasses() {
        try {
            localStorage.setItem('attendance_classes', JSON.stringify(this.classes));
        } catch (error) {
            console.error('Error saving classes:', error);
        }
    }

    loadSubjects() {
        try {
            // Proper Computer Science University Courses
            const defaultSubjects = [
                'CS301 - Data Structures and Algorithms',
                'CS302 - Database Systems',
                'CS303 - Computer Networks',
                'CS304 - Software Engineering',
                'CS305 - Operating Systems',
                'CS306 - Web Development'
            ];
            const storedSubjects = localStorage.getItem('attendance_subjects');
            if (storedSubjects) {
                const parsed = JSON.parse(storedSubjects);
                return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultSubjects;
            }
            return defaultSubjects;
        } catch (error) {
            console.error('Error loading subjects:', error);
            return [
                'CS301 - Data Structures and Algorithms',
                'CS302 - Database Systems',
                'CS303 - Computer Networks',
                'CS304 - Software Engineering',
                'CS305 - Operating Systems',
                'CS306 - Web Development'
            ];
        }
    }

    saveSubjects() {
        try {
            localStorage.setItem('attendance_subjects', JSON.stringify(this.subjects));
        } catch (error) {
            console.error('Error saving subjects:', error);
        }
    }

    loadSettings() {
        try {
            const defaultSettings = {
                attendanceThreshold: 75,
                notificationEnabled: true,
                qrCodeEnabled: true
            };
            const storedSettings = localStorage.getItem('attendance_settings');
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                return parsed && typeof parsed === 'object' ? parsed : defaultSettings;
            }
            return defaultSettings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                attendanceThreshold: 75,
                notificationEnabled: true,
                qrCodeEnabled: true
            };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('attendance_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    // Utility methods
    showModal(title, content) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal-overlay').classList.add('active');
        
        this.setupModalEvents();
    }

    hideModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }

    setupModalEvents() {
        const overlay = document.getElementById('modal-overlay');
        const closeBtn = document.querySelector('.close-modal');
        
        closeBtn.onclick = () => this.hideModal();
        overlay.onclick = (e) => {
            if (e.target === overlay) this.hideModal();
        };
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    calculateAttendancePercentage(studentId, subject = null, classFilter = null) {
        const studentRecords = this.attendanceData.filter(record => 
            record.studentId === studentId &&
            (!subject || record.subject === subject) &&
            (!classFilter || record.class === classFilter)
        );

        if (studentRecords.length === 0) return 0;

        const presentCount = studentRecords.filter(record => 
            record.status === 'present' || record.status === 'late').length;
        
        return Math.round((presentCount / studentRecords.length) * 100);
    }

    generateMonthlyReport(className, yearMonth) {
        // Ensure we have latest data
        this.attendanceData = this.loadAttendanceData();
        
        const [year, month] = yearMonth.split('-');
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const classRecords = this.attendanceData.filter(record => 
            record.class === className &&
            new Date(record.date) >= startDate &&
            new Date(record.date) <= endDate
        );

        // Group by student and calculate statistics
        const studentStats = {};
        classRecords.forEach(record => {
            if (!studentStats[record.studentId]) {
                studentStats[record.studentId] = {
                    studentId: record.studentId,
                    present: 0,
                    absent: 0,
                    total: 0
                };
            }
            
            studentStats[record.studentId].total++;
            if (record.status === 'present') {
                studentStats[record.studentId].present++;
            } else {
                studentStats[record.studentId].absent++;
            }
        });

        // Calculate percentages
        Object.values(studentStats).forEach(stats => {
            stats.percentage = Math.round((stats.present / stats.total) * 100);
        });

        return {
            className,
            month: yearMonth,
            totalDays: classRecords.length / Object.keys(studentStats).length,
            studentStats: Object.values(studentStats)
        };
    }

    checkLowAttendanceNotifications() {
        // Reload data to ensure we have latest
        this.attendanceData = this.loadAttendanceData();
        
        // Reload users
        authSystem.users = authSystem.loadUsers();
        
        const students = authSystem.users.filter(user => user.role === 'student');
        const notifications = [];
        
        let existingIds = new Set();
        let existingNotifications = [];
        try {
            const stored = localStorage.getItem('attendance_notifications');
            if (stored) {
                existingNotifications = JSON.parse(stored);
                if (Array.isArray(existingNotifications)) {
                    // Use more specific keys to avoid duplicates
                    existingIds = new Set(existingNotifications.map(n => {
                        if (n.isSummary) {
                            return `${n.studentId}-overall-summary`;
                        }
                        return `${n.studentId}-${n.subject || 'overall'}-${n.class || ''}`;
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading existing notifications:', error);
            existingIds = new Set();
            existingNotifications = [];
        }
        
        // Clear old generic "overall" notifications that don't specify subjects
        existingNotifications = existingNotifications.filter(n => {
            // Keep only notifications that have subject info or are summaries
            return n.subject || n.isSummary || !n.message.includes('overall attendance');
        });

        students.forEach(student => {
            // Check per-subject AND per-class attendance (more specific and helpful)
            const studentRecords = this.attendanceData.filter(r => r.studentId === student.studentId);
            
            // Group by subject and class
            const subjectClassGroups = {};
            studentRecords.forEach(record => {
                const key = `${record.subject}_${record.class}`;
                if (!subjectClassGroups[key]) {
                    subjectClassGroups[key] = {
                        subject: record.subject,
                        class: record.class,
                        records: []
                    };
                }
                subjectClassGroups[key].records.push(record);
            });
            
            // Track low attendance subjects for summary
            const lowAttendanceSubjects = [];
            
            // Check each subject-class combination
            Object.values(subjectClassGroups).forEach(group => {
                const totalRecords = group.records.length;
                const presentCount = group.records.filter(r => 
                    r.status === 'present' || r.status === 'late'
                ).length;
                const percentage = Math.round((presentCount / totalRecords) * 100);
                
                if (percentage < this.settings.attendanceThreshold && percentage > 0) {
                    const key = `${student.studentId}-${group.subject}-${group.class}`;
                    if (!existingIds.has(key)) {
                        // Create specific notification for each subject-class with low attendance
                        notifications.push({
                            studentId: student.studentId,
                            message: `⚠️ Low Attendance Alert: ${group.subject} (${group.class}) - Your attendance is ${percentage}%, which is below the required ${this.settings.attendanceThreshold}%`,
                            date: new Date().toISOString(),
                            type: 'warning',
                            subject: group.subject,
                            class: group.class,
                            percentage: percentage
                        });
                        lowAttendanceSubjects.push({
                            subject: group.subject,
                            class: group.class,
                            percentage: percentage
                        });
                    }
                }
            });
            
            // Only create overall notification if there are multiple subjects with low attendance
            // This provides a summary without being redundant
            if (lowAttendanceSubjects.length > 1) {
                const overallPercentage = this.calculateAttendancePercentage(student.studentId);
                const key = `${student.studentId}-overall-summary`;
                if (!existingIds.has(key) && overallPercentage < this.settings.attendanceThreshold) {
                    const subjectsList = lowAttendanceSubjects.map(s => `${s.subject} (${s.percentage}%)`).join(', ');
                    notifications.push({
                        studentId: student.studentId,
                        message: `📊 Overall Attendance Summary: Your overall attendance is ${overallPercentage}%. Low attendance in: ${subjectsList}`,
                        date: new Date().toISOString(),
                        type: 'warning',
                        subject: null,
                        class: null,
                        isSummary: true
                    });
                }
            }
        });

        if (notifications.length > 0 || existingNotifications.length !== JSON.parse(localStorage.getItem('attendance_notifications') || '[]').length) {
            // Merge new notifications with cleaned existing ones
            const allNotifications = [...existingNotifications, ...notifications];
            // Remove duplicates based on key
            const uniqueNotifications = [];
            const seenKeys = new Set();
            allNotifications.forEach(n => {
                const key = n.isSummary 
                    ? `${n.studentId}-overall-summary`
                    : `${n.studentId}-${n.subject || 'overall'}-${n.class || ''}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    uniqueNotifications.push(n);
                }
            });
            localStorage.setItem('attendance_notifications', JSON.stringify(uniqueNotifications));
        }
        return notifications;
    }

    saveNotifications(notifications) {
        try {
            const existingStr = localStorage.getItem('attendance_notifications') || '[]';
            const existing = JSON.parse(existingStr);
            const updated = Array.isArray(existing) ? [...existing, ...notifications] : notifications;
            localStorage.setItem('attendance_notifications', JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }

    getStudentNotifications(studentId) {
        try {
            const allNotificationsStr = localStorage.getItem('attendance_notifications') || '[]';
            const allNotifications = JSON.parse(allNotificationsStr);
            if (Array.isArray(allNotifications)) {
                return allNotifications.filter(notification => notification.studentId === studentId);
            }
            return [];
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    // Export functionality
    exportToCSV(data, filename) {
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    exportToPDF(content, filename) {
        // Simplified PDF export - in a real application, you would use jsPDF with proper formatting
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${filename}</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Initialize common system
const commonSystem = new CommonSystem();

// Initialize comprehensive university data
function initializeSampleData() {
    // Check if users exist, if not create comprehensive university dataset
    let users = JSON.parse(localStorage.getItem('attendance_users') || '[]');
    
    // Check if we need to initialize teachers (less than 5 teachers)
    const existingTeachers = users.filter(u => u.role === 'teacher');
    let teachersAdded = false;
    
    if (existingTeachers.length < 5) {
        // Generate comprehensive university teacher dataset
        const universityTeachers = generateUniversityTeachers();
        
        // Remove existing teachers (except admin)
        users = users.filter(u => u.role !== 'teacher' && u.role !== 'student');
        
        // Add all university teachers
        users = [...users, ...universityTeachers];
        teachersAdded = true;
        console.log(`Initialized ${universityTeachers.length} university teachers`);
    }
    
    // Only initialize if we have very few students (less than 50)
    const existingStudents = users.filter(u => u.role === 'student');
    if (existingStudents.length < 50) {
        // Generate comprehensive university student dataset
        const universityStudents = generateUniversityStudents();
        
        // Remove existing students (keep admin and teachers)
        users = users.filter(u => u.role !== 'student');
        
        // Add all university students
        users = [...users, ...universityStudents];
        localStorage.setItem('attendance_users', JSON.stringify(users));
        console.log(`Initialized ${universityStudents.length} university students`);
    } else if (teachersAdded) {
        // Save teachers if we added them but didn't add students
        localStorage.setItem('attendance_users', JSON.stringify(users));
    }

    // Only create attendance data if none exists
    if (!localStorage.getItem('attendance_data') || JSON.parse(localStorage.getItem('attendance_data')).length === 0) {
        createInitialAttendanceRecords();
    }
}

// Generate comprehensive university teacher dataset
function generateUniversityTeachers() {
    const teachers = [];
    let userIdCounter = 2; // Start after admin(1), keep teacher1 as id 2
    
    // List of realistic teacher names with CS subjects they teach
    const teacherData = [
        { firstName: 'John', lastName: 'Smith', subject: 'CS301 - Data Structures and Algorithms', class: 'Class 01' },
        { firstName: 'Sarah', lastName: 'Johnson', subject: 'CS302 - Database Systems', class: 'Class 01' },
        { firstName: 'Michael', lastName: 'Williams', subject: 'CS303 - Computer Networks', class: 'Class 02' },
        { firstName: 'Emily', lastName: 'Brown', subject: 'CS304 - Software Engineering', class: 'Class 02' },
        { firstName: 'David', lastName: 'Jones', subject: 'CS305 - Operating Systems', class: 'Class 03' },
        { firstName: 'Jessica', lastName: 'Garcia', subject: 'CS306 - Web Development', class: 'Class 03' },
        { firstName: 'Robert', lastName: 'Miller', subject: 'CS301 - Data Structures and Algorithms', class: 'Class 04' },
        { firstName: 'Amanda', lastName: 'Davis', subject: 'CS302 - Database Systems', class: 'Class 04' },
        { firstName: 'James', lastName: 'Rodriguez', subject: 'CS303 - Computer Networks', class: 'Class 05' },
        { firstName: 'Michelle', lastName: 'Martinez', subject: 'CS304 - Software Engineering', class: 'Class 05' },
        { firstName: 'William', lastName: 'Anderson', subject: 'CS305 - Operating Systems', class: 'Class 06' },
        { firstName: 'Laura', lastName: 'Taylor', subject: 'CS306 - Web Development', class: 'Class 06' },
        { firstName: 'Ahmed', lastName: 'Al-Mansouri', subject: 'CS301 - Data Structures and Algorithms', class: 'Class 01' },
        { firstName: 'Fatima', lastName: 'Al-Zahrani', subject: 'CS302 - Database Systems', class: 'Class 02' },
        { firstName: 'Mohammed', lastName: 'Al-Otaibi', subject: 'CS303 - Computer Networks', class: 'Class 03' },
        { firstName: 'Aisha', lastName: 'Al-Ghamdi', subject: 'CS304 - Software Engineering', class: 'Class 04' },
        { firstName: 'Hassan', lastName: 'Al-Mutairi', subject: 'CS305 - Operating Systems', class: 'Class 05' },
        { firstName: 'Mariam', lastName: 'Al-Shammari', subject: 'CS306 - Web Development', class: 'Class 06' },
        { firstName: 'Omar', lastName: 'Hassan', subject: 'CS301 - Data Structures and Algorithms', class: 'Class 02' },
        { firstName: 'Zainab', lastName: 'Ibrahim', subject: 'CS302 - Database Systems', class: 'Class 03' }
    ];
    
        // Keep the original teacher1
        teachers.push({
            id: 2,
            username: 'teacher1',
            password: 'teacher123',
            role: 'teacher',
            name: 'John Smith',
            subject: 'CS301 - Data Structures and Algorithms',
            assignedClasses: ['Class 01'],
            createdAt: new Date('2024-01-01').toISOString()
        });
    
    // Generate additional teachers
    teacherData.forEach((teacher, index) => {
        const fullName = `${teacher.firstName} ${teacher.lastName}`;
        const username = `teacher_${teacher.firstName.toLowerCase()}_${teacher.lastName.toLowerCase()}`;
        const pictureId = Math.floor(Math.random() * 70) + 1;
        
        teachers.push({
            id: userIdCounter++,
            username: username,
            password: 'teacher123',
            role: 'teacher',
            name: fullName,
            subject: teacher.subject,
            assignedClasses: [teacher.class],
            picture: `https://i.pravatar.cc/150?img=${pictureId}`,
            createdAt: new Date('2024-09-01').toISOString()
        });
    });
    
    return teachers;
}

// Generate comprehensive university student dataset
function generateUniversityStudents() {
    const students = [];
    let studentIdCounter = 1;
    let userIdCounter = 4; // Start after admin(1), teacher1(2), student1(3)
    
    // University class structure - 6 classes with 25-30 students each
    const classes = ['Class 01', 'Class 02', 'Class 03', 'Class 04', 'Class 05', 'Class 06'];
    const studentsPerClass = [28, 26, 30, 25, 27, 29]; // Realistic class sizes
    
    // Comprehensive list of realistic student names
    const firstNames = [
        'Ahmed', 'Mohammed', 'Ali', 'Hassan', 'Omar', 'Khalid', 'Yusuf', 'Ibrahim', 'Abdullah', 'Saeed',
        'Fatima', 'Aisha', 'Mariam', 'Zainab', 'Khadija', 'Amina', 'Sara', 'Layla', 'Noor', 'Yasmin',
        'John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles',
        'Sarah', 'Emily', 'Jessica', 'Ashley', 'Amanda', 'Melissa', 'Deborah', 'Michelle', 'Laura', 'Kimberly'
    ];
    
    const lastNames = [
        'Al-Mansouri', 'Al-Zahrani', 'Al-Otaibi', 'Al-Ghamdi', 'Al-Mutairi', 'Al-Shammari', 'Al-Dosari', 'Al-Qahtani',
        'Hassan', 'Ibrahim', 'Khalil', 'Mahmoud', 'Nasser', 'Omar', 'Rashid', 'Salem', 'Tariq', 'Waleed',
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez'
    ];
    
    classes.forEach((className, classIndex) => {
        const numStudents = studentsPerClass[classIndex];
        
        for (let i = 0; i < numStudents; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const fullName = `${firstName} ${lastName}`;
            const studentId = `STU${String(classIndex + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`;
            const username = `student_${className.toLowerCase().replace(' ', '_')}_${i + 1}`;
            const pictureId = Math.floor(Math.random() * 70) + 1; // Random avatar 1-70
            
            students.push({
                id: userIdCounter++,
                username: username,
                password: 'student123',
                role: 'student',
                name: fullName,
                studentId: studentId,
                class: className,
                picture: `https://i.pravatar.cc/150?img=${pictureId}`,
                enrollment: '2024-09-01',
                createdAt: new Date('2024-09-01').toISOString()
            });
        }
    });
    
    return students;
}

// Create initial attendance records for demonstration
function createInitialAttendanceRecords() {
    const today = new Date();
    const attendanceData = [];
    let idCounter = 1;
    
    // Get all students and teachers
    const users = JSON.parse(localStorage.getItem('attendance_users') || '[]');
    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');
    const subjects = [
        'CS301 - Data Structures and Algorithms',
        'CS302 - Database Systems',
        'CS303 - Computer Networks',
        'CS304 - Software Engineering',
        'CS305 - Operating Systems',
        'CS306 - Web Development'
    ];
    const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];
    
    // Map subjects to teachers (assign teachers to subjects in round-robin)
    const subjectTeacherMap = {};
    subjects.forEach((subject, index) => {
        // Assign teachers to subjects in round-robin fashion
        const teacher = teachers[index % teachers.length] || teachers[0] || { username: 'teacher1' };
        subjectTeacherMap[subject] = teacher.username;
    });
    
    // Create attendance records for the past 10 days
    for (let day = 0; day < 10; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        // For each subject, create attendance for each class
        subjects.forEach((subject, subjectIndex) => {
            const period = periods[subjectIndex];
            const markedBy = subjectTeacherMap[subject] || 'teacher1';
            
            // Group students by class
            const studentsByClass = {};
            students.forEach(student => {
                if (!studentsByClass[student.class]) {
                    studentsByClass[student.class] = [];
                }
                studentsByClass[student.class].push(student);
            });
            
            // Create attendance for each class
            Object.keys(studentsByClass).forEach(className => {
                const classStudents = studentsByClass[className];
                
                classStudents.forEach((student, studentIndex) => {
                    // Realistic attendance patterns:
                    // - 70-90% attendance rate overall
                    // - Some students have perfect attendance
                    // - Some students have lower attendance
                    let status = 'present';
                    const attendanceRate = 0.75 + (studentIndex % 10) * 0.02; // Varies by student
                    
                    if (Math.random() > attendanceRate) {
                        // Sometimes late instead of absent
                        status = Math.random() > 0.3 ? 'absent' : 'late';
                    }
                    
                    attendanceData.push({
                        id: idCounter++,
                        studentId: student.studentId,
                        class: className,
                        subject: subject,
                        period: period,
                        date: dateStr,
                        status: status,
                        markedBy: markedBy,
                        markedAt: new Date(dateStr + 'T' + (8 + subjectIndex) + ':00:00').toISOString()
                    });
                });
            });
        });
    }
    
    localStorage.setItem('attendance_data', JSON.stringify(attendanceData));
    console.log(`Created ${attendanceData.length} attendance records`);
    
    // Trigger notification check
    if (typeof commonSystem !== 'undefined') {
        commonSystem.attendanceData = attendanceData;
        commonSystem.checkLowAttendanceNotifications();
    }
}

// Force re-initialization function (for admin use)
function forceReinitializeUniversityData() {
    // Clear existing data (but keep admin)
    let users = JSON.parse(localStorage.getItem('attendance_users') || '[]');
    const admin = users.find(u => u.role === 'admin');
    
    // Clear all data
    localStorage.removeItem('attendance_users');
    localStorage.removeItem('attendance_data');
    localStorage.removeItem('attendance_notifications');
    
    // Restore admin
    if (admin) {
        localStorage.setItem('attendance_users', JSON.stringify([admin]));
    }
    
    // Re-initialize
    initializeSampleData();
    
    // Reload systems
    if (typeof authSystem !== 'undefined') {
        authSystem.users = authSystem.loadUsers();
    }
    if (typeof commonSystem !== 'undefined') {
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
    }
    
    alert('University data re-initialized with ~165 students and 20 teachers! Please refresh the page.');
    return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSampleData();
    // Reload auth system to get updated users
    if (typeof authSystem !== 'undefined') {
        authSystem.users = authSystem.loadUsers();
    }
    if (typeof commonSystem !== 'undefined') {
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
    }
});