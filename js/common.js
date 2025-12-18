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
            const defaultSubjects = ['IT8007', 'IT7203', 'IT8105', 'IT8201', 'IT8302', 'IT8401'];
            const storedSubjects = localStorage.getItem('attendance_subjects');
            if (storedSubjects) {
                const parsed = JSON.parse(storedSubjects);
                return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultSubjects;
            }
            return defaultSubjects;
        } catch (error) {
            console.error('Error loading subjects:', error);
            return ['IT8007', 'IT7203', 'IT8105', 'IT8201', 'IT8302', 'IT8401'];
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
        try {
            const existingNotifications = JSON.parse(localStorage.getItem('attendance_notifications') || '[]');
            if (Array.isArray(existingNotifications)) {
                existingIds = new Set(existingNotifications.map(n => `${n.studentId}-${n.subject || 'overall'}-${n.class || ''}`));
            }
        } catch (error) {
            console.error('Error loading existing notifications:', error);
            existingIds = new Set();
        }

        students.forEach(student => {
            // Check overall attendance
            const overallPercentage = this.calculateAttendancePercentage(student.studentId);
            if (overallPercentage < this.settings.attendanceThreshold && overallPercentage > 0) {
                const key = `${student.studentId}-overall`;
                if (!existingIds.has(key)) {
                    notifications.push({
                        studentId: student.studentId,
                        message: `Your overall attendance is ${overallPercentage}%, which is below the required ${this.settings.attendanceThreshold}%`,
                        date: new Date().toISOString(),
                        type: 'warning',
                        subject: null
                    });
                }
            }
            
            // Check per-subject AND per-class attendance
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
                        notifications.push({
                            studentId: student.studentId,
                            message: `Your attendance for ${group.subject} – ${group.class} is ${percentage}%, which is below the required ${this.settings.attendanceThreshold}%`,
                            date: new Date().toISOString(),
                            type: 'warning',
                            subject: group.subject,
                            class: group.class
                        });
                    }
                }
            });
        });

        if (notifications.length > 0) {
            this.saveNotifications(notifications);
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

// Initialize sample data for demo
function initializeSampleData() {
    // Only initialize if no data exists
    if (localStorage.getItem('attendance_data') && JSON.parse(localStorage.getItem('attendance_data')).length > 0) {
        return; // Data already exists
    }

    // Check if users exist, if not create sample students
    let users = JSON.parse(localStorage.getItem('attendance_users') || '[]');
    if (users.length <= 3) {
        // Add sample students for multiple classes (Class 01 and Class 02)
        const sampleStudents = [
            // Class 01 students
            { id: 4, username: 'student2', password: 'student123', role: 'student', name: 'Ahmed Ali', studentId: 'S002', class: 'Class 01', picture: 'https://i.pravatar.cc/150?img=12', enrollment: '2024-09-01' },
            { id: 5, username: 'student3', password: 'student123', role: 'student', name: 'Fatima Hassan', studentId: 'S003', class: 'Class 01', picture: 'https://i.pravatar.cc/150?img=47', enrollment: '2024-09-01' },
            { id: 6, username: 'student4', password: 'student123', role: 'student', name: 'Mohammed Khalid', studentId: 'S004', class: 'Class 01', picture: 'https://i.pravatar.cc/150?img=33', enrollment: '2024-09-01' },
            { id: 7, username: 'student5', password: 'student123', role: 'student', name: 'Sara Abdullah', studentId: 'S005', class: 'Class 01', picture: 'https://i.pravatar.cc/150?img=45', enrollment: '2024-09-01' },
            // Class 02 students
            { id: 8, username: 'student6', password: 'student123', role: 'student', name: 'Khalid Ahmed', studentId: 'S006', class: 'Class 02', picture: 'https://i.pravatar.cc/150?img=15', enrollment: '2024-09-01' },
            { id: 9, username: 'student7', password: 'student123', role: 'student', name: 'Noor Al-Din', studentId: 'S007', class: 'Class 02', picture: 'https://i.pravatar.cc/150?img=23', enrollment: '2024-09-01' },
            { id: 10, username: 'student8', password: 'student123', role: 'student', name: 'Yasmin Mohammed', studentId: 'S008', class: 'Class 02', picture: 'https://i.pravatar.cc/150?img=32', enrollment: '2024-09-01' },
            { id: 11, username: 'student9', password: 'student123', role: 'student', name: 'Omar Hassan', studentId: 'S009', class: 'Class 02', picture: 'https://i.pravatar.cc/150?img=51', enrollment: '2024-09-01' },
            { id: 12, username: 'student10', password: 'student123', role: 'student', name: 'Layla Ibrahim', studentId: 'S010', class: 'Class 02', picture: 'https://i.pravatar.cc/150?img=44', enrollment: '2024-09-01' }
        ];
        
        // Update existing student1 if needed
        const student1Index = users.findIndex(u => u.username === 'student1');
        if (student1Index !== -1) {
            users[student1Index] = { ...users[student1Index], class: 'Class 01', studentId: 'S001', picture: 'https://i.pravatar.cc/150?img=68', enrollment: '2024-09-01' };
        }
        
        users = [...users, ...sampleStudents];
        localStorage.setItem('attendance_users', JSON.stringify(users));
    }

    // Create sample attendance data for demo
    const today = new Date();
    const attendanceData = [];
    let idCounter = 1;
    
    // Create attendance records for the past few days
    for (let day = 0; day < 5; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];
        
        // IT8007 - Student S001 attended 4 out of 5 classes (80%)
        if (day < 4) {
            attendanceData.push({
                id: idCounter++,
                studentId: 'S001',
                class: 'Class 01',
                subject: 'IT8007',
                date: dateStr,
                status: 'present',
                period: 'Period 1',
                markedBy: 'teacher1',
                markedAt: new Date(dateStr).toISOString()
            });
        } else {
            attendanceData.push({
                id: idCounter++,
                studentId: 'S001',
                class: 'Class 01',
                subject: 'IT8007',
                date: dateStr,
                status: 'absent',
                period: 'Period 1',
                markedBy: 'teacher1',
                markedAt: new Date(dateStr).toISOString()
            });
        }
        
        // IT8007 - Student S002 attended 2 out of 5 classes (40% - below threshold for Class 01)
        if (day < 2) {
            attendanceData.push({
                id: idCounter++,
                studentId: 'S002',
                class: 'Class 01',
                subject: 'IT8007',
                date: dateStr,
                status: 'present',
                period: 'Period 1',
                markedBy: 'teacher1',
                markedAt: new Date(dateStr).toISOString()
            });
        } else {
            attendanceData.push({
                id: idCounter++,
                studentId: 'S002',
                class: 'Class 01',
                subject: 'IT8007',
                date: dateStr,
                status: 'absent',
                period: 'Period 1',
                markedBy: 'teacher1',
                markedAt: new Date(dateStr).toISOString()
            });
        }
        
        // IT8007 - Class 02 - Student S006 attended 2 out of 5 (40% - below threshold)
        if (day < 2) {
            attendanceData.push({
                id: idCounter++,
                studentId: 'S006',
                class: 'Class 02',
                subject: 'IT8007',
                date: dateStr,
                status: 'present',
                period: 'Period 1',
                markedBy: 'teacher1',
                markedAt: new Date(dateStr).toISOString()
            });
        } else {
            attendanceData.push({
                id: idCounter++,
                studentId: 'S006',
                class: 'Class 02',
                subject: 'IT8007',
                date: dateStr,
                status: 'absent',
                period: 'Period 1',
                markedBy: 'teacher1',
                markedAt: new Date(dateStr).toISOString()
            });
        }
        
        // IT7203 - Student S001 attended all classes (100%)
        attendanceData.push({
            id: idCounter++,
            studentId: 'S001',
            class: 'Class 01',
            subject: 'IT7203',
            date: dateStr,
            status: 'present',
            period: 'Period 2',
            markedBy: 'teacher1',
            markedAt: new Date(dateStr).toISOString()
        });
        
        // IT7203 - Student S002 attended 3 out of 5 classes (60% - below threshold for Class 01)
        if (day < 3) {
            attendanceData.push({
                id: idCounter++,
                studentId: 'S002',
                class: 'Class 01',
                subject: 'IT7203',
                date: dateStr,
                status: 'present',
                period: 'Period 2',
                markedBy: 'teacher1',
                markedAt: new Date(dateStr).toISOString()
            });
        } else {
            attendanceData.push({
                id: idCounter++,
                studentId: 'S002',
                class: 'Class 01',
                subject: 'IT7203',
                date: dateStr,
                status: 'absent',
                period: 'Period 2',
                markedBy: 'teacher1',
                markedAt: new Date(dateStr).toISOString()
            });
        }
        
        // IT7203 - Class 02 - Student S007 attended 2 out of 5 (40% - below threshold)
        if (day < 2) {
            attendanceData.push({
                id: idCounter++,
                studentId: 'S007',
                class: 'Class 02',
                subject: 'IT7203',
                date: dateStr,
                status: 'present',
                period: 'Period 2',
                markedBy: 'teacher1',
                markedAt: new Date(dateStr).toISOString()
            });
        } else {
            attendanceData.push({
                id: idCounter++,
                studentId: 'S007',
                class: 'Class 02',
                subject: 'IT7203',
                date: dateStr,
                status: 'absent',
                period: 'Period 2',
                markedBy: 'teacher1',
                markedAt: new Date(dateStr).toISOString()
            });
        }
    }
    
    localStorage.setItem('attendance_data', JSON.stringify(attendanceData));
    
    // Trigger notification check
    if (typeof commonSystem !== 'undefined') {
        commonSystem.attendanceData = attendanceData;
        commonSystem.checkLowAttendanceNotifications();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSampleData();
    // Reload auth system to get updated users
    if (typeof authSystem !== 'undefined') {
        authSystem.users = authSystem.loadUsers();
    }
});