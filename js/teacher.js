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
        
        // If showing QR attendance section, check for active sessions and restart monitoring
        if (sectionId === 'qr-attendance') {
            this.checkAndResumeQRSession();
        }
    }
    
    checkAndResumeQRSession() {
        // Check if there's an active QR session
        const activeSessions = JSON.parse(localStorage.getItem('qr_active_sessions') || '{}');
        const sessionIds = Object.keys(activeSessions);
        
        if (sessionIds.length > 0) {
            // Get the most recent session
            const latestSessionId = sessionIds.sort().pop();
            const session = activeSessions[latestSessionId];
            
            // Check if session is still valid
            const now = new Date();
            const expiresAt = new Date(session.expiresAt);
            
            if (now < expiresAt) {
                // Re-display the QR code and resume monitoring
                this.displayActiveQRSession(latestSessionId, session);
            } else {
                // Session expired, clear it
                delete activeSessions[latestSessionId];
                localStorage.setItem('qr_active_sessions', JSON.stringify(activeSessions));
            }
        }
    }
    
    displayActiveQRSession(sessionId, sessionData) {
        const container = document.getElementById('qr-code-container');
        
        // Create QR code string
        const qrString = JSON.stringify({
            sessionId: sessionId,
            class: sessionData.class,
            subject: sessionData.subject
        });
        
        // Clear container
        container.innerHTML = '';
        
        // Create wrapper div for QR code
        const qrCodeWrapper = document.createElement('div');
        qrCodeWrapper.id = 'qrcode-display-' + sessionId;
        qrCodeWrapper.style.cssText = 'margin: 20px 0; display: flex; justify-content: center;';
        container.appendChild(qrCodeWrapper);
        
        // Generate QR code using QRCode library
        this.generateQRCodeImage(qrCodeWrapper, qrString, sessionData.class, sessionData.subject);
        
        // Display session info and attendance list
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0;">Active QR Code Session: ${sessionData.class} - ${sessionData.subject}</h4>
                <p><strong>Session ID:</strong> ${sessionId}</p>
                <p><strong>Valid until:</strong> ${new Date(sessionData.expiresAt).toLocaleString()}</p>
                <p style="color: #2e7d32;"><strong>Display this QR code for students to scan</strong></p>
            </div>
            <div id="qr-attendance-list" style="margin-top: 20px;">
                <h4>Attendance (Real-time)</h4>
                <div id="qr-attendance-students" style="background: #f5f5f5; padding: 15px; border-radius: 5px; min-height: 100px;">
                    <p style="color: #666;">Loading...</p>
                </div>
            </div>
            <button id="stop-qr-session" class="btn-secondary" style="margin-top: 15px;">Stop Session</button>
        `;
        container.appendChild(infoDiv);
        
        // Setup stop session button
        document.getElementById('stop-qr-session').addEventListener('click', () => {
            this.stopQRSession(sessionId);
        });
        
        // Start real-time monitoring
        this.startRealTimeMonitoring(sessionId);
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

        // Generate a unique session ID
        const sessionId = 'QR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const timestamp = new Date().toISOString();
        
        // Create QR session data
        const qrSessionData = {
            sessionId: sessionId,
            class: className,
            subject: subject,
            teacher: this.currentTeacher.username,
            timestamp: timestamp,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes validity
            type: 'attendance'
        };

        // Store active QR session in localStorage
        const activeSessions = JSON.parse(localStorage.getItem('qr_active_sessions') || '{}');
        activeSessions[sessionId] = qrSessionData;
        localStorage.setItem('qr_active_sessions', JSON.stringify(activeSessions));
        
        // Initialize attendance tracking for this session
        const sessionAttendanceKey = `qr_attendance_${sessionId}`;
        if (!localStorage.getItem(sessionAttendanceKey)) {
            localStorage.setItem(sessionAttendanceKey, JSON.stringify([]));
        }

        // Trigger storage event for real-time updates
        localStorage.setItem('qr_session_updated', JSON.stringify({ sessionId, action: 'created' }));

        // Create QR code string (JSON format for easy parsing)
        const qrString = JSON.stringify({
            sessionId: sessionId,
            class: className,
            subject: subject
        });

        const container = document.getElementById('qr-code-container');
        
        // Clear previous QR code
        container.innerHTML = '';
        
        // Create wrapper div for QR code
        const qrCodeWrapper = document.createElement('div');
        qrCodeWrapper.id = 'qrcode-display-' + sessionId;
        qrCodeWrapper.style.cssText = 'margin: 20px 0; display: flex; justify-content: center;';
        container.appendChild(qrCodeWrapper);
        
        // Generate QR code using QRCode library
        this.generateQRCodeImage(qrCodeWrapper, qrString, className, subject);

        // Display session info and real-time attendance list
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4 style="margin-top: 0;">QR Code Session: ${className} - ${subject}</h4>
                <p><strong>Session ID:</strong> ${sessionId}</p>
                <p><strong>Valid until:</strong> ${new Date(qrSessionData.expiresAt).toLocaleString()}</p>
                <p style="color: #2e7d32;"><strong>Display this QR code for students to scan</strong></p>
            </div>
            <div id="qr-attendance-list" style="margin-top: 20px;">
                <h4>Attendance (Real-time)</h4>
                <div id="qr-attendance-students" style="background: #f5f5f5; padding: 15px; border-radius: 5px; min-height: 100px;">
                    <p style="color: #666;">Waiting for students to scan...</p>
                </div>
            </div>
            <button id="stop-qr-session" class="btn-secondary" style="margin-top: 15px;">Stop Session</button>
        `;
        container.appendChild(infoDiv);

        // Setup stop session button
        document.getElementById('stop-qr-session').addEventListener('click', () => {
            this.stopQRSession(sessionId);
        });

        // Start real-time monitoring for this session
        this.startRealTimeMonitoring(sessionId);
    }

    startRealTimeMonitoring(sessionId) {
        // Clear any existing interval
        if (this.qrMonitoringInterval) {
            clearInterval(this.qrMonitoringInterval);
        }

        // Store current session ID
        this.currentMonitoringSessionId = sessionId;

        // Update attendance list immediately
        this.updateAttendanceList(sessionId);

        // Set up interval to check for new attendance (for same-tab updates)
        this.qrMonitoringInterval = setInterval(() => {
            // Only update if we're still monitoring this session
            if (this.currentMonitoringSessionId === sessionId) {
                this.updateAttendanceList(sessionId);
            }
        }, 1000); // Check every second

        // Listen to storage events for real-time updates across tabs
        // Remove old listener if exists
        if (this.storageEventListener) {
            window.removeEventListener('storage', this.storageEventListener);
        }
        
        this.storageEventListener = (e) => {
            if (e.key === `qr_attendance_${sessionId}` || 
                (e.key === 'qr_attendance_marked' && e.newValue)) {
                try {
                    const data = JSON.parse(e.newValue);
                    if (data.sessionId === sessionId) {
                        this.updateAttendanceList(sessionId);
                    }
                } catch (err) {
                    // Just update anyway if parsing fails
                    this.updateAttendanceList(sessionId);
                }
            }
        };
        
        window.addEventListener('storage', this.storageEventListener);
        
        // Also listen for custom events (for same-tab updates)
        if (this.customStorageListener) {
            window.removeEventListener('qrAttendanceUpdated', this.customStorageListener);
        }
        
        this.customStorageListener = (e) => {
            if (e.detail && e.detail.sessionId === sessionId) {
                this.updateAttendanceList(sessionId);
            }
        };
        
        window.addEventListener('qrAttendanceUpdated', this.customStorageListener);
    }

    updateAttendanceList(sessionId) {
        const sessionAttendanceKey = `qr_attendance_${sessionId}`;
        const attendanceList = JSON.parse(localStorage.getItem(sessionAttendanceKey) || '[]');
        const container = document.getElementById('qr-attendance-students');

        if (!container) return; // Container might not exist if session was stopped

        if (attendanceList.length === 0) {
            container.innerHTML = '<p style="color: #666;">Waiting for students to scan...</p>';
            return;
        }

        let html = `<div style="display: grid; gap: 10px;">`;
        attendanceList.forEach((record, index) => {
            const student = authSystem.users.find(u => u.studentId === record.studentId || u.username === record.studentId);
            const scanTime = new Date(record.timestamp).toLocaleTimeString();
            html += `
                <div style="background: white; padding: 10px; border-radius: 5px; border-left: 4px solid #4caf50; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${student ? student.name : record.studentId}</strong>
                        ${student ? `<span style="color: #666; margin-left: 10px;">(${record.studentId})</span>` : ''}
                    </div>
                    <span style="color: #666; font-size: 0.9em;">${scanTime}</span>
                </div>
            `;
        });
        html += `</div>`;
        html += `<p style="margin-top: 15px; font-weight: bold; color: #2e7d32;">Total: ${attendanceList.length} student(s) marked present</p>`;
        
        container.innerHTML = html;
    }

    stopQRSession(sessionId) {
        // Clear monitoring interval
        if (this.qrMonitoringInterval) {
            clearInterval(this.qrMonitoringInterval);
            this.qrMonitoringInterval = null;
        }

        // Clear session ID
        this.currentMonitoringSessionId = null;

        // Remove event listeners
        if (this.storageEventListener) {
            window.removeEventListener('storage', this.storageEventListener);
            this.storageEventListener = null;
        }
        if (this.customStorageListener) {
            window.removeEventListener('qrAttendanceUpdated', this.customStorageListener);
            this.customStorageListener = null;
        }

        // Remove from active sessions
        const activeSessions = JSON.parse(localStorage.getItem('qr_active_sessions') || '{}');
        delete activeSessions[sessionId];
        localStorage.setItem('qr_active_sessions', JSON.stringify(activeSessions));

        // Clear the QR code container
        document.getElementById('qr-code-container').innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">QR session stopped. Generate a new QR code to start a new session.</p>';
        
        alert('QR Session stopped. Attendance records have been saved.');
    }

    generateQRCodeImage(wrapper, qrString, className, subject) {
        // Clear wrapper first
        wrapper.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Generating QR code...</p>';
        
        // Use online API as primary method (most reliable)
        const encodedText = encodeURIComponent(qrString);
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedText}`;
        
        const img = document.createElement('img');
        img.src = qrApiUrl;
        img.alt = 'QR Code - Scan this with student app';
        img.style.cssText = 'border: 3px solid #4caf50; padding: 15px; background: white; max-width: 100%; display: block; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';
        img.onload = () => {
            wrapper.innerHTML = '';
            wrapper.appendChild(img);
            console.log('QR code generated successfully');
        };
        img.onerror = () => {
            console.error('Online QR API failed, trying local library...');
            // Fallback to local library
            this.tryLocalQRCodeLibrary(wrapper, qrString, className, subject);
        };
        
        // Set a timeout to show something even if image is slow to load
        setTimeout(() => {
            if (wrapper.querySelector('p')) {
                // Still showing loading, try local library
                wrapper.innerHTML = '';
                wrapper.appendChild(img);
            }
        }, 1000);
    }

    tryLocalQRCodeLibrary(wrapper, qrString, className, subject) {
        wrapper.innerHTML = '';
        
        // Check if QRCode library is available
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not available');
            this.generateQRCodeFallback(wrapper.parentElement, qrString, className, subject);
            return;
        }
        
        try {
            // Try using QRCode constructor
            const qrDiv = document.createElement('div');
            qrDiv.style.cssText = 'display: inline-block; text-align: center;';
            wrapper.appendChild(qrDiv);
            
            new QRCode(qrDiv, {
                text: qrString,
                width: 400,
                height: 400,
                colorDark: '#000000',
                colorLight: '#FFFFFF',
                correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.H : 0
            });
            
            // Style the generated QR code after a short delay
            setTimeout(() => {
                const qrImg = qrDiv.querySelector('img');
                const qrCanvas = qrDiv.querySelector('canvas');
                if (qrImg) {
                    qrImg.style.cssText = 'border: 3px solid #4caf50; padding: 15px; background: white; max-width: 100%; display: block; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';
                    qrDiv.style.cssText = 'display: block; text-align: center;';
                } else if (qrCanvas) {
                    qrCanvas.style.cssText = 'border: 3px solid #4caf50; padding: 15px; background: white; max-width: 100%; display: block; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1);';
                    qrDiv.style.cssText = 'display: block; text-align: center;';
                } else {
                    // If still no QR code, show fallback
                    console.error('QRCode library did not generate image/canvas');
                    this.generateQRCodeFallback(wrapper.parentElement, qrString, className, subject);
                }
            }, 300);
            
        } catch (e) {
            console.error('QRCode constructor failed:', e);
            this.generateQRCodeFallback(wrapper.parentElement, qrString, className, subject);
        }
    }

    tryQRCodeConstructor(wrapper, qrString, className, subject) {
        try {
            // Clear wrapper
            wrapper.innerHTML = '';
            
            // Try using constructor API
            const qrDiv = document.createElement('div');
            qrDiv.style.cssText = 'display: inline-block;';
            wrapper.appendChild(qrDiv);
            
            new QRCode(qrDiv, {
                text: qrString,
                width: 300,
                height: 300,
                colorDark: '#000000',
                colorLight: '#FFFFFF',
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Style the generated QR code
            setTimeout(() => {
                const qrImg = qrDiv.querySelector('img');
                const qrCanvas = qrDiv.querySelector('canvas');
                if (qrImg) {
                    qrImg.style.cssText = 'border: 1px solid #ccc; padding: 10px; background: white; max-width: 100%; display: block;';
                } else if (qrCanvas) {
                    qrCanvas.style.cssText = 'border: 1px solid #ccc; padding: 10px; background: white; max-width: 100%; display: block;';
                }
            }, 100);
            
        } catch (e) {
            console.error('QRCode constructor failed:', e);
            this.generateQRCodeFallback(wrapper.parentElement, qrString, className, subject);
        }
    }

    generateQRCodeFallback(container, qrString, className, subject) {
        container.innerHTML = `
            <div style="background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h4>QR Code for ${className} - ${subject}</h4>
                <p><strong>QR Code Data:</strong></p>
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; word-break: break-all;">
                    ${qrString}
                </div>
                <p style="color: #856404;">Note: Please use a QR code generator app or library to display this data as a scannable QR code.</p>
            </div>
        `;
    }
}

// Helper function to generate attendance IDs
commonSystem.generateAttendanceId = function() {
    return Math.max(...commonSystem.attendanceData.map(r => r.id), 0) + 1;
};

// Initialize teacher system
const teacherSystem = new TeacherSystem();