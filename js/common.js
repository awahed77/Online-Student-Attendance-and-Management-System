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
        const defaultData = [
            {
                id: 1,
                studentId: 'S001',
                class: '10A',
                subject: 'Mathematics',
                date: '2024-01-15',
                status: 'present',
                markedBy: 'teacher1',
                markedAt: new Date().toISOString()
            }
        ];
        
        const storedData = localStorage.getItem('attendance_data');
        return storedData ? JSON.parse(storedData) : defaultData;
    }

    saveAttendanceData() {
        localStorage.setItem('attendance_data', JSON.stringify(this.attendanceData));
    }

    loadClasses() {
        const defaultClasses = ['10A', '10B', '11A', '11B', '12A', '12B'];
        const storedClasses = localStorage.getItem('attendance_classes');
        return storedClasses ? JSON.parse(storedClasses) : defaultClasses;
    }

    saveClasses() {
        localStorage.setItem('attendance_classes', JSON.stringify(this.classes));
    }

    loadSubjects() {
        const defaultSubjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science'];
        const storedSubjects = localStorage.getItem('attendance_subjects');
        return storedSubjects ? JSON.parse(storedSubjects) : defaultSubjects;
    }

    saveSubjects() {
        localStorage.setItem('attendance_subjects', JSON.stringify(this.subjects));
    }

    loadSettings() {
        const defaultSettings = {
            attendanceThreshold: 75,
            notificationEnabled: true,
            qrCodeEnabled: true
        };
        const storedSettings = localStorage.getItem('attendance_settings');
        return storedSettings ? JSON.parse(storedSettings) : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('attendance_settings', JSON.stringify(this.settings));
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
            record.status === 'present').length;
        
        return Math.round((presentCount / studentRecords.length) * 100);
    }

    generateMonthlyReport(className, yearMonth) {
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
        const students = authSystem.users.filter(user => user.role === 'student');
        const notifications = [];

        students.forEach(student => {
            const percentage = this.calculateAttendancePercentage(student.studentId);
            if (percentage < this.settings.attendanceThreshold) {
                notifications.push({
                    studentId: student.studentId,
                    message: `Your attendance is ${percentage}%, which is below the required ${this.settings.attendanceThreshold}%`,
                    date: new Date().toISOString(),
                    type: 'warning'
                });
            }
        });

        this.saveNotifications(notifications);
        return notifications;
    }

    saveNotifications(notifications) {
        const existing = JSON.parse(localStorage.getItem('attendance_notifications') || '[]');
        const updated = [...existing, ...notifications];
        localStorage.setItem('attendance_notifications', JSON.stringify(updated));
    }

    getStudentNotifications(studentId) {
        const allNotifications = JSON.parse(localStorage.getItem('attendance_notifications') || '[]');
        return allNotifications.filter(notification => notification.studentId === studentId);
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