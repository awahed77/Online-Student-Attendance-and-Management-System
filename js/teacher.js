// Teacher System
class TeacherSystem {
    constructor() {
        this.currentTeacher = authSystem.getCurrentUser();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.populateClassAndSubjectFilters();
        this.setupEventListeners();
        this.loadAttendanceRecords();
        // Set default date to today
        const dateInput = document.getElementById('attendance-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
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
        
        // Load schedules when schedule section is shown
        if (sectionId === 'schedule-classes') {
            this.loadSchedules();
            // Re-attach event listener for add schedule button
            setTimeout(() => {
                const addScheduleBtn = document.getElementById('add-schedule-btn');
                if (addScheduleBtn) {
                    // Remove any existing listeners by cloning
                    const newBtn = addScheduleBtn.cloneNode(true);
                    addScheduleBtn.parentNode.replaceChild(newBtn, addScheduleBtn);
                    // Add new listener
                    document.getElementById('add-schedule-btn').addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Add schedule button clicked from showSection');
                        this.showAddScheduleForm();
                    });
                }
            }, 100);
        }
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
        const loadStudentsBtn = document.getElementById('load-students-btn');
        if (loadStudentsBtn) {
            loadStudentsBtn.addEventListener('click', () => this.loadStudentsForAttendance());
        }
        
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importAttendance());
        }
        
        // View Records
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.loadAttendanceRecords());
        }
        
        const exportCsvBtn = document.getElementById('export-csv');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => this.exportAttendanceCSV());
        }
        
        // Reports
        const generateReportBtn = document.getElementById('generate-monthly-report');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateMonthlyReport());
        }
        
        const exportReportBtn = document.getElementById('export-report-pdf');
        if (exportReportBtn) {
            exportReportBtn.addEventListener('click', () => this.exportReportPDF());
        }
        
        // QR Attendance
        const generateQrBtn = document.getElementById('generate-qr');
        if (generateQrBtn) {
            generateQrBtn.addEventListener('click', () => this.generateQRCode());
        }
        
        const startScanBtn = document.getElementById('start-scan');
        if (startScanBtn) {
            startScanBtn.addEventListener('click', () => this.startQRScanner());
        }
        
        // Schedule Classes - Use event delegation for dynamic content
        document.addEventListener('click', (e) => {
            if (e.target && (e.target.id === 'add-schedule-btn' || e.target.closest('#add-schedule-btn'))) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add schedule button clicked');
                this.showAddScheduleForm();
            }
        });
        
        // Also try direct attachment if element exists
        const addScheduleBtn = document.getElementById('add-schedule-btn');
        if (addScheduleBtn) {
            addScheduleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add schedule button clicked (direct)');
                this.showAddScheduleForm();
            });
        }
    }

    // Take Attendance
    loadStudentsForAttendance() {
        // Reload data before loading students
        authSystem.users = authSystem.loadUsers();
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        
        const className = document.getElementById('class-select').value;
        const subject = document.getElementById('subject-select').value;
        const period = document.getElementById('period-select').value;
        const attendanceDate = document.getElementById('attendance-date').value;
        
        if (!className || !subject || !period || !attendanceDate) {
            alert('Please select class, subject, period, and date');
            return;
        }

        const students = authSystem.users.filter(user => 
            user.role === 'student' && user.class === className
        );

        const container = document.getElementById('attendance-form-container');
        
        // Check existing attendance for this session
        const existingRecords = commonSystem.attendanceData.filter(record =>
            record.class === className &&
            record.subject === subject &&
            record.period === period &&
            record.date === attendanceDate
        );

        let html = `
            <h3>Mark Attendance for ${className} - ${subject} - ${period}</h3>
            <p><strong>Date:</strong> ${new Date(attendanceDate).toLocaleDateString()}</p>
            <form id="attendance-form">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        students.forEach(student => {
            // Find existing record for this student
            const existingRecord = existingRecords.find(r => r.studentId === student.studentId);
            const defaultStatus = existingRecord ? existingRecord.status : 'absent';
            const studentPicture = student.picture || 'https://i.pravatar.cc/150?img=' + (student.id || 1);
            
            html += `
                <tr>
                    <td><img src="${studentPicture}" alt="${student.name}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;"></td>
                    <td>${student.studentId}</td>
                    <td>${student.name}</td>
                    <td>
                        <select name="status-${student.studentId}">
                            <option value="present" ${defaultStatus === 'present' ? 'selected' : ''}>Present</option>
                            <option value="absent" ${defaultStatus === 'absent' ? 'selected' : ''}>Absent</option>
                            <option value="late" ${defaultStatus === 'late' ? 'selected' : ''}>Late</option>
                        </select>
                    </td>
                    <td>
                        <button type="button" onclick="teacherSystem.updateIndividualAttendance('${student.studentId}', '${className}', '${subject}', '${period}', '${attendanceDate}')" class="btn-secondary">
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
            this.saveAttendance(className, subject, period, attendanceDate);
        });
    }

    saveAttendance(className, subject, period, attendanceDate) {
        // Reload data before saving to ensure we have latest
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        authSystem.users = authSystem.loadUsers();
        
        const form = document.getElementById('attendance-form');
        if (!form) {
            alert('Form not found. Please try again.');
            return;
        }
        
        const students = authSystem.users.filter(user => 
            user.role === 'student' && user.class === className
        );
        
        let hasChanges = false;
        students.forEach(student => {
            const statusSelect = form.querySelector(`[name="status-${student.studentId}"]`);
            if (!statusSelect) return;
            
            const status = statusSelect.value;

            // Check if attendance already exists for this specific period and date
            const existingIndex = commonSystem.attendanceData.findIndex(record => 
                record.studentId === student.studentId &&
                record.class === className &&
                record.subject === subject &&
                record.period === period &&
                record.date === attendanceDate
            );

            const attendanceRecord = {
                id: existingIndex !== -1 ? commonSystem.attendanceData[existingIndex].id : commonSystem.generateAttendanceId(),
                studentId: student.studentId,
                class: className,
                subject: subject,
                period: period,
                date: attendanceDate,
                status: status,
                markedBy: this.currentTeacher ? this.currentTeacher.username : 'teacher',
                markedAt: new Date().toISOString()
            };

            if (existingIndex !== -1) {
                commonSystem.attendanceData[existingIndex] = attendanceRecord;
            } else {
                commonSystem.attendanceData.push(attendanceRecord);
            }
            hasChanges = true;
        });

        if (hasChanges) {
            commonSystem.saveAttendanceData();
            
            // Reload from localStorage to ensure sync
            commonSystem.attendanceData = commonSystem.loadAttendanceData();
            
            alert('Attendance saved successfully!');
            
            // Check for low attendance notifications
            commonSystem.checkLowAttendanceNotifications();
            
            // Reload the form to show updated status
            this.loadStudentsForAttendance();
        }
    }

    updateIndividualAttendance(studentId, className, subject, period, attendanceDate) {
        // Reload data before updating
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        
        const statusSelect = document.querySelector(`[name="status-${studentId}"]`);
        if (!statusSelect) {
            alert('Unable to find status selector. Please try again.');
            return;
        }
        
        const status = statusSelect.value;

        const existingIndex = commonSystem.attendanceData.findIndex(record => 
            record.studentId === studentId &&
            record.class === className &&
            record.subject === subject &&
            record.period === period &&
            record.date === attendanceDate
        );

        const attendanceRecord = {
            id: existingIndex !== -1 ? commonSystem.attendanceData[existingIndex].id : commonSystem.generateAttendanceId(),
            studentId: studentId,
            class: className,
            subject: subject,
            period: period,
            date: attendanceDate,
            status: status,
            markedBy: this.currentTeacher ? this.currentTeacher.username : 'teacher',
            markedAt: new Date().toISOString()
        };

        if (existingIndex !== -1) {
            commonSystem.attendanceData[existingIndex] = attendanceRecord;
        } else {
            commonSystem.attendanceData.push(attendanceRecord);
        }

        commonSystem.saveAttendanceData();
        
        // Reload from localStorage
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        
        alert('Attendance updated successfully!');
        
        // Check for low attendance notifications
        commonSystem.checkLowAttendanceNotifications();
        
        // Reload the form to show updated status
        this.loadStudentsForAttendance();
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
        // Reload attendance data from localStorage
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        
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
                        <th>Period</th>
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
                    <td>${record.period || 'N/A'}</td>
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
                <div class="form-group">
                    <label for="edit-period">Period:</label>
                    <select id="edit-period" required>
                        <option value="Period 1" ${record.period === 'Period 1' ? 'selected' : ''}>Period 1</option>
                        <option value="Period 2" ${record.period === 'Period 2' ? 'selected' : ''}>Period 2</option>
                        <option value="Period 3" ${record.period === 'Period 3' ? 'selected' : ''}>Period 3</option>
                        <option value="Period 4" ${record.period === 'Period 4' ? 'selected' : ''}>Period 4</option>
                        <option value="Period 5" ${record.period === 'Period 5' ? 'selected' : ''}>Period 5</option>
                        <option value="Period 6" ${record.period === 'Period 6' ? 'selected' : ''}>Period 6</option>
                    </select>
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
        commonSystem.attendanceData[recordIndex].period = document.getElementById('edit-period').value;
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
        // Reload attendance data from localStorage
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        
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
        const period = prompt('Enter period for this QR code (e.g., Period 1, Period 2):', 'Period 1');
        
        if (!period) {
            alert('Period is required');
            return;
        }
        
        if (!className || !subject) {
            alert('Please select both class and subject');
            return;
        }

        // Create secure QR session using QR session manager
        const qrData = qrSessionManager.createQRSession(
            this.currentTeacher.id,
            this.currentTeacher.username,
            className,
            subject,
            period
        );

        const qrString = JSON.stringify(qrData);
        const container = document.getElementById('qr-code-container');
        
        // Create a simple QR code pattern as a fallback
        const createDummyQRCode = () => {
            const size = 200;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            
            // Create a simple pattern that looks like a QR code
            const cellSize = 10;
            const data = [
                [1,1,1,1,1,1,1,0,0,0,1,1,0,1,0,1,1,1,1,1],
                [1,0,0,0,0,0,1,0,1,1,0,0,1,0,0,1,0,0,0,1],
                [1,0,1,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,0,1],
                [1,0,1,1,1,0,1,0,1,0,0,1,1,0,0,1,0,1,0,1],
                [1,0,1,1,1,0,1,0,1,1,0,0,1,0,0,1,0,0,0,1],
                [1,0,0,0,0,0,1,0,1,0,1,0,1,0,0,1,1,1,1,1],
                [1,1,1,1,1,1,1,0,1,0,1,0,1,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,1,1,0,1,1,0,1,1,0,1,0,1],
                [1,1,0,1,0,0,1,1,1,0,0,1,0,1,1,1,0,0,1,1],
                [1,0,1,1,0,1,0,1,0,0,1,0,0,1,0,0,1,0,1,0],
                [0,1,1,0,0,1,1,0,1,0,1,0,1,1,0,1,0,1,1,0],
                [0,1,0,1,0,0,1,1,1,1,0,1,0,0,1,1,0,1,0,1],
                [1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,0,1,1,0,1],
                [0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,0,1,1,0],
                [1,1,1,1,1,1,1,0,1,0,1,1,0,1,0,0,1,0,1,0],
                [1,0,0,0,0,0,1,0,1,1,0,0,1,1,1,1,0,1,1,0],
                [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,0,1,0,1,0],
                [1,0,1,1,1,0,1,0,1,0,1,1,0,1,0,1,1,0,1,0],
                [1,0,1,1,1,0,1,0,0,1,0,1,1,0,1,1,0,1,0,1],
                [1,0,0,0,0,0,1,0,1,1,0,0,1,1,0,1,0,1,1,0]
            ];
            
            // Draw the pattern
            for (let y = 0; y < data.length; y++) {
                for (let x = 0; x < data[y].length; x++) {
                    if (data[y][x] === 1) {
                        ctx.fillStyle = '#000000';
                        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    }
                }
            }
            
            // Add some text
            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SAMPLE QR CODE', size/2, size - 10);
            
            return canvas.toDataURL();
        };
        
        // Reload QR sessions from localStorage to ensure we have latest data
        qrSessionManager.qrSessions = qrSessionManager.loadQRSessions();
        
        const expiresAt = new Date(qrData.expiresAt);
        const timeRemaining = Math.round((expiresAt - new Date()) / 1000 / 60);

        // Create container for QR code
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h3 style="color: #1f2937; margin-bottom: 10px;">QR Code for ${className} - ${subject} - ${period}</h3>
                <p style="color: #6b7280; font-size: 14px;">Valid for ${timeRemaining} minutes • One-time use only</p>
            </div>
            <div id="qr-canvas-container" style="display: flex; justify-content: center; margin: 20px 0; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <!-- QR code will be generated here -->
            </div>
        `;
        
        const qrCanvasContainer = document.getElementById('qr-canvas-container');
        
        // Generate QR code using QRCode.js library
        if (typeof QRCode !== 'undefined') {
            // Create canvas element
            const canvas = document.createElement('canvas');
            qrCanvasContainer.appendChild(canvas);
            
            try {
                // QRCode.js version 1.5.3 uses toCanvas differently
                QRCode.toCanvas(canvas, qrString, function (error) {
                    if (error) {
                        console.error('QR Code generation error:', error);
                        // Try alternative method
                        QRCode.toDataURL(qrString, function (err, url) {
                            if (err) {
                                qrCanvasContainer.innerHTML = `
                                    <div style="text-align: center; padding: 20px;">
                                        <p style="color: #ef4444; margin-bottom: 10px;">QR Code generation failed</p>
                                        <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-family: monospace; font-size: 11px; word-break: break-all;">
                                            ${qrString}
                                        </div>
                                    </div>
                                `;
                            } else {
                                qrCanvasContainer.innerHTML = `<img src="${url}" alt="QR Code" style="max-width: 300px; border: 2px solid #e5e7eb; padding: 10px; background: white; border-radius: 8px;">`;
                            }
                        });
                    } else {
                        // Successfully generated QR code
                        console.log('QR Code generated successfully');
                    }
                });
            } catch (error) {
                console.error('QR Code library error:', error);
                qrCanvasContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <p style="color: #ef4444; margin-bottom: 10px;">QR Code library error</p>
                        <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all;">
                            ${qrString}
                        </div>
                    </div>
                `;
            }
        } else {
            // Fallback: Show QR data as text if library not loaded
            qrCanvasContainer.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <img src="${createDummyQRCode()}" alt="QR Code" style="border: 2px solid #e5e7eb; padding: 15px; background: white; border-radius: 8px; margin-bottom: 15px;">
                    <p style="color: #6b7280; font-size: 12px; margin-bottom: 10px;">QR Code library not loaded. Please scan the text below:</p>
                    <div style="padding: 15px; background: #f3f4f6; border-radius: 8px; font-family: monospace; font-size: 11px; word-break: break-all; max-width: 400px; margin: 0 auto;">
                        ${qrString}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML += `
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <h4 style="color: #1f2937; margin-bottom: 15px; font-size: 16px;">QR Code Details</h4>
                <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px 15px; color: #374151;">
                    <strong>Class:</strong> <span>${className}</span>
                    <strong>Subject:</strong> <span>${subject}</span>
                    <strong>Period:</strong> <span>${period}</span>
                    <strong>Token:</strong> <span style="font-family: monospace; font-size: 12px;">${qrData.token}</span>
                    <strong>Expires:</strong> <span>${expiresAt.toLocaleTimeString()} (${timeRemaining} min remaining)</span>
                    <strong>Status:</strong> <span style="color: #10b981; font-weight: 600;">Active - One-time use</span>
                </div>
            </div>
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 15px; border-radius: 10px; border-left: 4px solid #f59e0b; margin-top: 15px;">
                <p style="color: #92400e; font-size: 13px; margin: 0;">
                    <strong>Note:</strong> Students can scan this QR code to mark attendance. Each QR code can only be used once and expires in 15 minutes. Make sure students scan it before it expires.
                </p>
            </div>
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

    // Class Scheduling Functions
    loadSchedules() {
        const schedules = this.loadSchedulesData();
        const container = document.getElementById('schedules-list');
        
        if (schedules.length === 0) {
            container.innerHTML = '<p>No scheduled classes found. Click "Add Class Schedule" to create one.</p>';
            return;
        }

        // Filter out expired schedules and update status
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Room</th>
                        <th>Period</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        schedules.forEach(schedule => {
            const startDate = new Date(schedule.startDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = schedule.endDate ? new Date(schedule.endDate) : null;
            if (endDate) endDate.setHours(0, 0, 0, 0);
            
            let status = 'Active';
            if (endDate && endDate < today) {
                status = 'Expired';
            } else if (startDate > today) {
                status = 'Upcoming';
            }
            
            const timeDisplay = schedule.startTime && schedule.endTime 
                ? `${schedule.startTime} - ${schedule.endTime}` 
                : 'Not set';
            
            html += `
                <tr>
                    <td>${schedule.class}</td>
                    <td>${schedule.subject}</td>
                    <td>${schedule.teacher || 'Not assigned'}</td>
                    <td>${dayNames[schedule.dayOfWeek] || 'Not set'}</td>
                    <td>${timeDisplay}</td>
                    <td>${schedule.room || 'Not set'}</td>
                    <td>${schedule.period || 'N/A'}</td>
                    <td>${new Date(schedule.startDate).toLocaleDateString()}</td>
                    <td>${schedule.endDate ? new Date(schedule.endDate).toLocaleDateString() : 'Ongoing'}</td>
                    <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
                    <td>
                        <button onclick="teacherSystem.editSchedule(${schedule.id})" class="btn-secondary" style="margin-right: 5px;">Edit</button>
                        <button onclick="teacherSystem.deleteSchedule(${schedule.id})" class="logout-btn">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    loadSchedulesData() {
        try {
            const stored = localStorage.getItem('class_schedules');
            if (stored) {
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch (error) {
            console.error('Error loading schedules:', error);
            return [];
        }
    }

    saveSchedulesData(schedules) {
        try {
            localStorage.setItem('class_schedules', JSON.stringify(schedules));
        } catch (error) {
            console.error('Error saving schedules:', error);
            alert('Error saving schedule. Please try again.');
        }
    }

    showAddScheduleForm(scheduleId = null) {
        console.log('showAddScheduleForm called', scheduleId);
        
        try {
            const schedules = this.loadSchedulesData();
            const schedule = scheduleId ? schedules.find(s => s.id === scheduleId) : null;
            
            // Get all teachers from users - reload users first
            authSystem.users = authSystem.loadUsers();
            const teachers = authSystem.users.filter(u => u.role === 'teacher');
            
            if (teachers.length === 0) {
                alert('No teachers found. Please create teacher accounts first.');
                return;
            }
        
        const formHTML = `
            <form id="add-schedule-form">
                <div class="form-group">
                    <label for="schedule-class">Class Name:</label>
                    <select id="schedule-class" required>
                        <option value="">Select Class</option>
                        ${commonSystem.classes.map(cls => `<option value="${cls}" ${schedule && schedule.class === cls ? 'selected' : ''}>${cls}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="schedule-subject">Subject:</label>
                    <select id="schedule-subject" required>
                        <option value="">Select Subject</option>
                        ${commonSystem.subjects.map(sub => `<option value="${sub}" ${schedule && schedule.subject === sub ? 'selected' : ''}>${sub}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="schedule-teacher">Assigned Teacher:</label>
                    <select id="schedule-teacher" required>
                        <option value="">Select Teacher</option>
                        ${teachers.map(teacher => `<option value="${teacher.username}" ${schedule && schedule.teacher === teacher.username ? 'selected' : ''}>${teacher.name} (${teacher.username})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="schedule-day">Day:</label>
                    <select id="schedule-day" required>
                        <option value="">Select Day</option>
                        <option value="0" ${schedule && schedule.dayOfWeek === 0 ? 'selected' : ''}>Sunday</option>
                        <option value="1" ${schedule && schedule.dayOfWeek === 1 ? 'selected' : ''}>Monday</option>
                        <option value="2" ${schedule && schedule.dayOfWeek === 2 ? 'selected' : ''}>Tuesday</option>
                        <option value="3" ${schedule && schedule.dayOfWeek === 3 ? 'selected' : ''}>Wednesday</option>
                        <option value="4" ${schedule && schedule.dayOfWeek === 4 ? 'selected' : ''}>Thursday</option>
                        <option value="5" ${schedule && schedule.dayOfWeek === 5 ? 'selected' : ''}>Friday</option>
                        <option value="6" ${schedule && schedule.dayOfWeek === 6 ? 'selected' : ''}>Saturday</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="schedule-start-time">Start Time:</label>
                    <input type="time" id="schedule-start-time" value="${schedule ? schedule.startTime || '' : ''}" required>
                </div>
                <div class="form-group">
                    <label for="schedule-end-time">End Time:</label>
                    <input type="time" id="schedule-end-time" value="${schedule ? schedule.endTime || '' : ''}" required>
                </div>
                <div class="form-group">
                    <label for="schedule-room">Room/Location:</label>
                    <input type="text" id="schedule-room" value="${schedule ? schedule.room || '' : ''}" placeholder="e.g., Room 101, Lab A" required>
                </div>
                <div class="form-group">
                    <label for="schedule-period">Period (if applicable):</label>
                    <select id="schedule-period">
                        <option value="">Not Applicable</option>
                        <option value="Period 1" ${schedule && schedule.period === 'Period 1' ? 'selected' : ''}>Period 1</option>
                        <option value="Period 2" ${schedule && schedule.period === 'Period 2' ? 'selected' : ''}>Period 2</option>
                        <option value="Period 3" ${schedule && schedule.period === 'Period 3' ? 'selected' : ''}>Period 3</option>
                        <option value="Period 4" ${schedule && schedule.period === 'Period 4' ? 'selected' : ''}>Period 4</option>
                        <option value="Period 5" ${schedule && schedule.period === 'Period 5' ? 'selected' : ''}>Period 5</option>
                        <option value="Period 6" ${schedule && schedule.period === 'Period 6' ? 'selected' : ''}>Period 6</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="schedule-start-date">Effective Start Date:</label>
                    <input type="date" id="schedule-start-date" value="${schedule ? schedule.startDate || '' : ''}" required>
                </div>
                <div class="form-group">
                    <label for="schedule-end-date">End Date (Optional):</label>
                    <input type="date" id="schedule-end-date" value="${schedule ? schedule.endDate || '' : ''}">
                    <small style="color: #6b7280; font-size: 12px;">Leave empty for ongoing schedule</small>
                </div>
                <div id="schedule-conflict-message" style="display: none; padding: 10px; margin: 10px 0; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 5px; color: #991b1b;"></div>
                <button type="submit" class="btn-primary">${schedule ? 'Update Schedule' : 'Save Schedule'}</button>
            </form>
        `;

        // Show modal
        if (typeof commonSystem !== 'undefined' && commonSystem.showModal) {
            commonSystem.showModal(schedule ? 'Edit Class Schedule' : 'Add Class Schedule', formHTML);
        } else {
            alert('Modal system not available');
            return;
        }
        
        // Wait a bit for modal to render
        setTimeout(() => {
            // Add real-time conflict checking
            const form = document.getElementById('add-schedule-form');
            if (!form) {
                console.error('Form not found in modal');
                return;
            }
            
            const inputs = form.querySelectorAll('select, input[type="time"], input[type="date"]');
            inputs.forEach(input => {
                input.addEventListener('change', () => this.checkScheduleConflicts(scheduleId));
            });
            
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Validate time range
                const startTime = document.getElementById('schedule-start-time').value;
                const endTime = document.getElementById('schedule-end-time').value;
                
                if (startTime && endTime) {
                    const startMinutes = this.timeToMinutes(startTime);
                    const endMinutes = this.timeToMinutes(endTime);
                    
                    if (endMinutes <= startMinutes) {
                        alert('End time must be after start time');
                        return;
                    }
                }
                
                // Validate date range
                const startDate = document.getElementById('schedule-start-date').value;
                const endDate = document.getElementById('schedule-end-date').value;
                
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    
                    if (end < start) {
                        alert('End date must be after or equal to start date');
                        return;
                    }
                }
                
                if (scheduleId) {
                    this.updateSchedule(scheduleId);
                } else {
                    this.addSchedule();
                }
            });
        }, 100);
        } catch (error) {
            console.error('Error showing schedule form:', error);
            alert('Error loading schedule form: ' + error.message);
        }
    }

    checkScheduleConflicts(excludeScheduleId = null) {
        const schedules = this.loadSchedulesData();
        const conflictMessage = document.getElementById('schedule-conflict-message');
        if (!conflictMessage) return;
        
        const className = document.getElementById('schedule-class')?.value;
        const dayOfWeek = parseInt(document.getElementById('schedule-day')?.value);
        const startTime = document.getElementById('schedule-start-time')?.value;
        const endTime = document.getElementById('schedule-end-time')?.value;
        const room = document.getElementById('schedule-room')?.value;
        const teacher = document.getElementById('schedule-teacher')?.value;
        const startDate = document.getElementById('schedule-start-date')?.value;
        const endDate = document.getElementById('schedule-end-date')?.value || null;
        
        if (!className || dayOfWeek === undefined || !startTime || !endTime || !room || !teacher || !startDate) {
            conflictMessage.style.display = 'none';
            return;
        }
        
        // Check for conflicts
        const conflicts = [];
        
        schedules.forEach(schedule => {
            if (excludeScheduleId && schedule.id === excludeScheduleId) return;
            
            // Check if schedules overlap in date range
            const scheduleStart = new Date(schedule.startDate);
            const scheduleEnd = schedule.endDate ? new Date(schedule.endDate) : new Date('2099-12-31');
            const newStart = new Date(startDate);
            const newEnd = endDate ? new Date(endDate) : new Date('2099-12-31');
            
            const dateOverlap = (newStart <= scheduleEnd && newEnd >= scheduleStart);
            
            if (dateOverlap && schedule.dayOfWeek === dayOfWeek) {
                // Check time overlap
                if (this.timesOverlap(startTime, endTime, schedule.startTime, schedule.endTime)) {
                    // Check room conflict
                    if (schedule.room && schedule.room.toLowerCase() === room.toLowerCase()) {
                        conflicts.push({
                            type: 'room',
                            message: `Room ${room} is already booked on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]} at ${startTime}-${endTime} for ${schedule.class} - ${schedule.subject}`
                        });
                    }
                    
                    // Check teacher conflict
                    if (schedule.teacher && schedule.teacher === teacher) {
                        conflicts.push({
                            type: 'teacher',
                            message: `Teacher is already assigned to ${schedule.class} - ${schedule.subject} on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]} at ${startTime}-${endTime}`
                        });
                    }
                    
                    // Check class conflict (same class at same time)
                    if (schedule.class === className) {
                        conflicts.push({
                            type: 'class',
                            message: `${className} already has a class scheduled on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]} at ${startTime}-${endTime}`
                        });
                    }
                }
            }
        });
        
        if (conflicts.length > 0) {
            conflictMessage.style.display = 'block';
            conflictMessage.innerHTML = '<strong>⚠️ Schedule Conflicts Detected:</strong><ul style="margin: 5px 0; padding-left: 20px;">' + 
                conflicts.map(c => `<li>${c.message}</li>`).join('') + 
                '</ul>';
        } else {
            conflictMessage.style.display = 'none';
        }
    }
    
    timesOverlap(start1, end1, start2, end2) {
        if (!start1 || !end1 || !start2 || !end2) return false;
        
        const time1Start = this.timeToMinutes(start1);
        const time1End = this.timeToMinutes(end1);
        const time2Start = this.timeToMinutes(start2);
        const time2End = this.timeToMinutes(end2);
        
        return (time1Start < time2End && time1End > time2Start);
    }
    
    timeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    addSchedule() {
        // Check for conflicts before saving
        const conflictMessage = document.getElementById('schedule-conflict-message');
        if (conflictMessage && conflictMessage.style.display === 'block') {
            if (!confirm('There are schedule conflicts detected. Do you still want to save this schedule?')) {
                return;
            }
        }
        
        const schedules = this.loadSchedulesData();
        const className = document.getElementById('schedule-class').value;
        const subject = document.getElementById('schedule-subject').value;
        const teacher = document.getElementById('schedule-teacher').value;
        const dayOfWeek = parseInt(document.getElementById('schedule-day').value);
        const startTime = document.getElementById('schedule-start-time').value;
        const endTime = document.getElementById('schedule-end-time').value;
        const room = document.getElementById('schedule-room').value;
        const period = document.getElementById('schedule-period').value || null;
        const startDate = document.getElementById('schedule-start-date').value;
        const endDate = document.getElementById('schedule-end-date').value || null;
        
        const newSchedule = {
            id: schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) + 1 : 1,
            class: className,
            subject: subject,
            teacher: teacher,
            dayOfWeek: dayOfWeek,
            startTime: startTime,
            endTime: endTime,
            room: room,
            period: period,
            startDate: startDate,
            endDate: endDate,
            status: 'active',
            createdBy: this.currentTeacher ? this.currentTeacher.username : 'teacher',
            createdAt: new Date().toISOString()
        };

        schedules.push(newSchedule);
        this.saveSchedulesData(schedules);
        commonSystem.hideModal();
        this.loadSchedules();
        alert('Class schedule created successfully!');
    }
    
    editSchedule(scheduleId) {
        this.showAddScheduleForm(scheduleId);
    }
    
    updateSchedule(scheduleId) {
        // Check for conflicts before saving
        const conflictMessage = document.getElementById('schedule-conflict-message');
        if (conflictMessage && conflictMessage.style.display === 'block') {
            if (!confirm('There are schedule conflicts detected. Do you still want to update this schedule?')) {
                return;
            }
        }
        
        const schedules = this.loadSchedulesData();
        const scheduleIndex = schedules.findIndex(s => s.id === scheduleId);
        
        if (scheduleIndex === -1) {
            alert('Schedule not found');
            return;
        }
        
        schedules[scheduleIndex] = {
            ...schedules[scheduleIndex],
            class: document.getElementById('schedule-class').value,
            subject: document.getElementById('schedule-subject').value,
            teacher: document.getElementById('schedule-teacher').value,
            dayOfWeek: parseInt(document.getElementById('schedule-day').value),
            startTime: document.getElementById('schedule-start-time').value,
            endTime: document.getElementById('schedule-end-time').value,
            room: document.getElementById('schedule-room').value,
            period: document.getElementById('schedule-period').value || null,
            startDate: document.getElementById('schedule-start-date').value,
            endDate: document.getElementById('schedule-end-date').value || null,
            updatedBy: this.currentTeacher ? this.currentTeacher.username : 'teacher',
            updatedAt: new Date().toISOString()
        };
        
        this.saveSchedulesData(schedules);
        commonSystem.hideModal();
        this.loadSchedules();
        alert('Class schedule updated successfully!');
    }

    deleteSchedule(scheduleId) {
        if (confirm('Are you sure you want to delete this schedule?')) {
            const schedules = this.loadSchedulesData();
            const filtered = schedules.filter(s => s.id !== scheduleId);
            this.saveSchedulesData(filtered);
            this.loadSchedules();
        }
    }
}

// Helper function to generate attendance IDs
commonSystem.generateAttendanceId = function() {
    // Reload data to ensure we have latest
    const data = commonSystem.loadAttendanceData();
    if (!data || data.length === 0) return 1;
    const maxId = Math.max(...data.map(r => r.id || 0), 0);
    return maxId + 1;
};

// Initialize teacher system
const teacherSystem = new TeacherSystem();