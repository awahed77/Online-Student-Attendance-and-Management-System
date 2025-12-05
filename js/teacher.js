// Teacher System
class TeacherSystem {
    constructor() {
        this.currentTeacher = authSystem.currentUser;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.populateClassAndSubjectFilters();
        this.setupEventListeners();
        this.loadAttendanceRecords();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('#teacher-dashboard .nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target.getAttribute('data-target');
                this.showSection(target);
            });
        });
    }

    showSection(sectionId) {
        document.querySelectorAll('#teacher-dashboard .content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.querySelectorAll('#teacher-dashboard .nav-btn').forEach(button => {
            button.classList.remove('active');
        });
        
        document.getElementById(sectionId).classList.add('active');
        document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');
    }

    populateClassAndSubjectFilters() {
        const classSelects = [
            document.getElementById('class-select'),
            document.getElementById('filter-class'),
            document.getElementById('report-class'),
            document.getElementById('qr-class-select')
        ];

        const subjectSelects = [
            document.getElementById('subject-select'),
            document.getElementById('filter-subject'),
            document.getElementById('qr-subject-select')
        ];

        classSelects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Select Class</option>' +
                    commonSystem.classes.map(cls => `<option value="${cls}">${cls}</option>`).join('');
            }
        });

        subjectSelects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">Select Subject</option>' +
                    commonSystem.subjects.map(sub => `<option value="${sub}">${sub}</option>`).join('');
            }
        });
    }

    setupEventListeners() {
        // Take Attendance
        document.getElementById('load-students-btn').addEventListener('click', () => this.loadStudentsForAttendance());
        document.getElementById('import-btn').addEventListener('click', () => this.importAttendance());
        
        // View Records
        document.getElementById('apply-filters').addEventListener('click', () => this.loadAttendanceRecords());
        document.getElementById('export-csv').addEventListener('click', () => this.exportAttendanceCSV());
        
        // Reports
        document.getElementById('generate-monthly-report').addEventListener('click', () => this.generateMonthlyReport());
        document.getElementById('export-report-pdf').addEventListener('click', () => this.exportReportPDF());
        
        // QR Attendance
        document.getElementById('generate-qr').addEventListener('click', () => this.generateQRCode());
        document.getElementById('start-scan').addEventListener('click', () => this.startQRScanner());
    }

    // Take Attendance
    loadStudentsForAttendance() {
        const className = document.getElementById('class-select').value;
        const subject = document.getElementById('subject-select').value;
        
        if (!className || !subject) {
            alert('Please select both class and subject');
            return;
        }

        const students = authSystem.users.filter(user => 
            user.role === 'student' && user.class === className
        );

        const container = document.getElementById('attendance-form-container');
        let html = `
            <h3>Mark Attendance for ${className} - ${subject}</h3>
            <form id="attendance-form">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        students.forEach(student => {
            html += `
                <tr>
                    <td>${student.studentId}</td>
                    <td>${student.name}</td>
                    <td>
                        <select name="status-${student.studentId}">
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                        </select>
                    </td>
                    <td>
                        <button type="button" onclick="teacherSystem.updateIndividualAttendance('${student.studentId}', '${className}', '${subject}')" class="btn-secondary">
                            Update
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
                <button type="submit" class="btn-primary">Save All Attendance</button>
            </form>
        `;

        container.innerHTML = html;

        document.getElementById('attendance-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAttendance(className, subject);
        });
    }

    saveAttendance(className, subject) {
        const form = document.getElementById('attendance-form');
        const students = authSystem.users.filter(user => 
            user.role === 'student' && user.class === className
        );

        const today = new Date().toISOString().split('T')[0];
        
        students.forEach(student => {
            const statusSelect = form.querySelector(`[name="status-${student.studentId}"]`);
            const status = statusSelect.value;

            // Check if attendance already exists for today
            const existingIndex = commonSystem.attendanceData.findIndex(record => 
                record.studentId === student.studentId &&
                record.class === className &&
                record.subject === subject &&
                record.date === today
            );

            const attendanceRecord = {
                id: existingIndex !== -1 ? commonSystem.attendanceData[existingIndex].id : commonSystem.generateAttendanceId(),
                studentId: student.studentId,
                class: className,
                subject: subject,
                date: today,
                status: status,
                markedBy: this.currentTeacher.username,
                markedAt: new Date().toISOString()
            };

            if (existingIndex !== -1) {
                commonSystem.attendanceData[existingIndex] = attendanceRecord;
            } else {
                commonSystem.attendanceData.push(attendanceRecord);
            }
        });

        commonSystem.saveAttendanceData();
        alert('Attendance saved successfully!');
        
        // Check for low attendance notifications
        commonSystem.checkLowAttendanceNotifications();
    }

    updateIndividualAttendance(studentId, className, subject) {
        const statusSelect = document.querySelector(`[name="status-${studentId}"]`);
        const status = statusSelect.value;
        const today = new Date().toISOString().split('T')[0];

        const existingIndex = commonSystem.attendanceData.findIndex(record => 
            record.studentId === studentId &&
            record.class === className &&
            record.subject === subject &&
            record.date === today
        );

        const attendanceRecord = {
            id: existingIndex !== -1 ? commonSystem.attendanceData[existingIndex].id : commonSystem.generateAttendanceId(),
            studentId: studentId,
            class: className,
            subject: subject,
            date: today,
            status: status,
            markedBy: this.currentTeacher.username,
            markedAt: new Date().toISOString()
        };

        if (existingIndex !== -1) {
            commonSystem.attendanceData[existingIndex] = attendanceRecord;
        } else {
            commonSystem.attendanceData.push(attendanceRecord);
        }

        commonSystem.saveAttendanceData();
        alert('Attendance updated successfully!');
    }

    importAttendance() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file to import');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            this.processImportedData(content, file.name);
        };
        reader.readAsText(file);
    }

    processImportedData(content, filename) {
        // Simple CSV parser - in a real application, you'd want more robust parsing
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const importedRecords = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index];
            });
            return record;
        }).filter(record => record.studentId); // Filter out empty lines

        // Add imported records to attendance data
        importedRecords.forEach(record => {
            record.id = commonSystem.generateAttendanceId();
            record.markedBy = this.currentTeacher.username;
            record.markedAt = new Date().toISOString();
            commonSystem.attendanceData.push(record);
        });

        commonSystem.saveAttendanceData();
        alert(`Successfully imported ${importedRecords.length} attendance records from ${filename}`);
        
        // Refresh the attendance records display
        this.loadAttendanceRecords();
    }

    // View Attendance Records
    loadAttendanceRecords() {
        const className = document.getElementById('filter-class').value;
        const subject = document.getElementById('filter-subject').value;
        const date = document.getElementById('filter-date').value;

        let filteredRecords = commonSystem.attendanceData.filter(record => 
            (!className || record.class === className) &&
            (!subject || record.subject === subject) &&
            (!date || record.date === date)
        );

        const container = document.getElementById('attendance-records');
        
        if (filteredRecords.length === 0) {
            container.innerHTML = '<p>No attendance records found.</p>';
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Student ID</th>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Marked By</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        filteredRecords.forEach(record => {
            const student = authSystem.users.find(u => u.studentId === record.studentId);
            html += `
                <tr>
                    <td>${commonSystem.formatDate(record.date)}</td>
                    <td>${record.studentId}</td>
                    <td>${record.class}</td>
                    <td>${record.subject}</td>
                    <td>${record.status}</td>
                    <td>${record.markedBy}</td>
                    <td>
                        <button onclick="teacherSystem.editAttendanceRecord(${record.id})" class="btn-secondary">Edit</button>
                        <button onclick="teacherSystem.deleteAttendanceRecord(${record.id})" class="logout-btn">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    editAttendanceRecord(recordId) {
        const record = commonSystem.attendanceData.find(r => r.id === recordId);
        if (!record) return;

        const formHTML = `
            <form id="edit-attendance-form">
                <div class="form-group">
                    <label for="edit-status">Status:</label>
                    <select id="edit-status" required>
                        <option value="present" ${record.status === 'present' ? 'selected' : ''}>Present</option>
                        <option value="absent" ${record.status === 'absent' ? 'selected' : ''}>Absent</option>
                        <option value="late" ${record.status === 'late' ? 'selected' : ''}>Late</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-date">Date:</label>
                    <input type="date" id="edit-date" value="${record.date}" required>
                </div>
                <button type="submit" class="btn-primary">Update Record</button>
            </form>
        `;

        commonSystem.showModal('Edit Attendance Record', formHTML);
        
        document.getElementById('edit-attendance-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateAttendanceRecord(recordId);
        });
    }

    updateAttendanceRecord(recordId) {
        const recordIndex = commonSystem.attendanceData.findIndex(r => r.id === recordId);
        if (recordIndex === -1) return;

        commonSystem.attendanceData[recordIndex].status = document.getElementById('edit-status').value;
        commonSystem.attendanceData[recordIndex].date = document.getElementById('edit-date').value;
        commonSystem.attendanceData[recordIndex].markedAt = new Date().toISOString();

        commonSystem.saveAttendanceData();
        commonSystem.hideModal();
        this.loadAttendanceRecords();
        
        // Recheck notifications
        commonSystem.checkLowAttendanceNotifications();
    }

    deleteAttendanceRecord(recordId) {
        if (confirm('Are you sure you want to delete this attendance record?')) {
            commonSystem.attendanceData = commonSystem.attendanceData.filter(r => r.id !== recordId);
            commonSystem.saveAttendanceData();
            this.loadAttendanceRecords();
        }
    }

    exportAttendanceCSV() {
        const className = document.getElementById('filter-class').value;
        const subject = document.getElementById('filter-subject').value;
        const date = document.getElementById('filter-date').value;

        let filteredRecords = commonSystem.attendanceData.filter(record => 
            (!className || record.class === className) &&
            (!subject || record.subject === subject) &&
            (!date || record.date === date)
        );

        // Add student names to export data
        const exportData = filteredRecords.map(record => {
            const student = authSystem.users.find(u => u.studentId === record.studentId);
            return {
                ...record,
                studentName: student ? student.name : 'Unknown'
            };
        });

        commonSystem.exportToCSV(exportData, 'attendance_records.csv');
    }

    // Reports
    generateMonthlyReport() {
        const className = document.getElementById('report-class').value;
        const month = document.getElementById('report-month').value;
        
        if (!className || !month) {
            alert('Please select both class and month');
            return;
        }

        const report = commonSystem.generateMonthlyReport(className, month);
        this.displayMonthlyReport(report);
    }

    displayMonthlyReport(report) {
        const container = document.getElementById('monthly-report-results');
        
        let html = `
            <h3>Monthly Attendance Report - ${report.className} (${report.month})</h3>
            <p>Total Days: ${report.totalDays}</p>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Present</th>
                        <th>Absent</th>
                        <th>Total</th>
                        <th>Percentage</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        report.studentStats.forEach(stats => {
            const student = authSystem.users.find(u => u.studentId === stats.studentId);
            const status = stats.percentage >= commonSystem.settings.attendanceThreshold ? 'Satisfactory' : 'Low';
            
            html += `
                <tr>
                    <td>${stats.studentId}</td>
                    <td>${student ? student.name : 'Unknown'}</td>
                    <td>${stats.present}</td>
                    <td>${stats.absent}</td>
                    <td>${stats.total}</td>
                    <td>${stats.percentage}%</td>
                    <td>${status}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    exportReportPDF() {
        const reportContent = document.getElementById('monthly-report-results').innerHTML;
        if (!reportContent) {
            alert('Please generate a report first');
            return;
        }
        commonSystem.exportToPDF(reportContent, 'monthly_attendance_report.pdf');
    }

    // QR Attendance
    generateQRCode() {
        const className = document.getElementById('qr-class-select').value;
        const subject = document.getElementById('qr-subject-select').value;
        
        if (!className || !subject) {
            alert('Please select both class and subject');
            return;
        }

        const qrData = {
            class: className,
            subject: subject,
            teacher: this.currentTeacher.username,
            timestamp: new Date().toISOString(),
            type: 'attendance'
        };

        const qrString = JSON.stringify(qrData);
        const container = document.getElementById('qr-code-container');
        
        // In a real application, you would use a QR code library like qrcode.js
        // For this example, we'll display the data as text
        container.innerHTML = `
            <h4>QR Code Data for ${className} - ${subject}</h4>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <strong>Scan this code with the student app:</strong><br>
                ${qrString}
            </div>
            <p><em>Note: In a real implementation, this would be a scannable QR code image</em></p>
        `;
    }

    startQRScanner() {
        const video = document.getElementById('qr-video');
        
        // In a real application, you would use a QR scanning library
        // For this example, we'll simulate QR code scanning
        alert('QR Scanner would activate here. In a real implementation, this would use the device camera to scan QR codes from student devices.');
        
        // Simulate a scanned QR code after 3 seconds
        setTimeout(() => {
            this.processScannedQR({
                studentId: 'S001',
                class: '10A',
                subject: 'Mathematics',
                timestamp: new Date().toISOString()
            });
        }, 3000);
    }

    processScannedQR(qrData) {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if attendance already exists
        const existingIndex = commonSystem.attendanceData.findIndex(record => 
            record.studentId === qrData.studentId &&
            record.class === qrData.class &&
            record.subject === qrData.subject &&
            record.date === today
        );

        const attendanceRecord = {
            id: existingIndex !== -1 ? commonSystem.attendanceData[existingIndex].id : commonSystem.generateAttendanceId(),
            studentId: qrData.studentId,
            class: qrData.class,
            subject: qrData.subject,
            date: today,
            status: 'present',
            markedBy: this.currentTeacher.username,
            markedAt: new Date().toISOString(),
            method: 'qr'
        };

        if (existingIndex !== -1) {
            commonSystem.attendanceData[existingIndex] = attendanceRecord;
        } else {
            commonSystem.attendanceData.push(attendanceRecord);
        }

        commonSystem.saveAttendanceData();
        
        const student = authSystem.users.find(u => u.studentId === qrData.studentId);
        alert(`Attendance marked for ${student ? student.name : qrData.studentId}`);
    }
}

// Helper function to generate attendance IDs
commonSystem.generateAttendanceId = function() {
    return Math.max(...commonSystem.attendanceData.map(r => r.id), 0) + 1;
};

// Initialize teacher system
const teacherSystem = new TeacherSystem();