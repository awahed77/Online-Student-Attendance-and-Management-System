// Student System
class StudentSystem {
    constructor() {
        this.currentStudent = authSystem.currentUser;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadStudentData();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('#student-dashboard .nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target.getAttribute('data-target');
                this.showSection(target);
            });
        });
    }

    showSection(sectionId) {
        document.querySelectorAll('#student-dashboard .content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.querySelectorAll('#student-dashboard .nav-btn').forEach(button => {
            button.classList.remove('active');
        });
        
        document.getElementById(sectionId).classList.add('active');
        document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');
    }

    setupEventListeners() {
        // Load data when switching to specific sections
        document.querySelector('[data-target="attendance-stats"]').addEventListener('click', () => {
            this.loadAttendanceChart();
        });
        
        document.querySelector('[data-target="notifications"]').addEventListener('click', () => {
            this.loadNotifications();
        });

        // QR Code Scanner
        document.getElementById('start-qr-scanner').addEventListener('click', () => this.startQRScanner());
        document.getElementById('stop-qr-scanner').addEventListener('click', () => this.stopQRScanner());
        
        // Image Upload Scanner
        document.getElementById('camera-scan-btn').addEventListener('click', () => this.showCameraScanner());
        document.getElementById('upload-scan-btn').addEventListener('click', () => this.showUploadScanner());
        document.getElementById('qr-image-upload').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('process-uploaded-image').addEventListener('click', () => this.processUploadedImage());
        
        // Initialize location status
        const locationText = document.getElementById('location-text');
        if (locationText) {
            locationText.textContent = 'Ready to scan QR code';
        }
    }

    loadStudentData() {
        this.loadAttendanceSummary();
        this.loadAttendanceRecords();
        this.loadNotifications();
    }

    loadAttendanceSummary() {
        const percentage = commonSystem.calculateAttendancePercentage(this.currentStudent.studentId);
        document.getElementById('attendance-percentage').textContent = `${percentage}%`;
        
        // Color code based on threshold
        const percentageElement = document.getElementById('attendance-percentage');
        if (percentage < commonSystem.settings.attendanceThreshold) {
            percentageElement.style.color = '#e74c3c';
        } else {
            percentageElement.style.color = '#2ecc71';
        }
    }

    loadAttendanceRecords() {
        const studentRecords = commonSystem.attendanceData.filter(record => 
            record.studentId === this.currentStudent.studentId
        );

        const container = document.getElementById('student-attendance-records');
        
        if (studentRecords.length === 0) {
            container.innerHTML = '<p>No attendance records found.</p>';
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Marked By</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Sort by date, most recent first
        studentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        studentRecords.forEach(record => {
            html += `
                <tr>
                    <td>${commonSystem.formatDate(record.date)}</td>
                    <td>${record.class}</td>
                    <td>${record.subject}</td>
                    <td>
                        <span class="status-${record.status}">
                            ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                    </td>
                    <td>${record.markedBy}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    loadAttendanceChart() {
        const ctx = document.getElementById('attendance-chart').getContext('2d');
        const studentRecords = commonSystem.attendanceData.filter(record => 
            record.studentId === this.currentStudent.studentId
        );

        // Group by subject and calculate percentages
        const subjectStats = {};
        commonSystem.subjects.forEach(subject => {
            const subjectRecords = studentRecords.filter(record => record.subject === subject);
            if (subjectRecords.length > 0) {
                const presentCount = subjectRecords.filter(record => record.status === 'present').length;
                subjectStats[subject] = Math.round((presentCount / subjectRecords.length) * 100);
            }
        });

        const subjects = Object.keys(subjectStats);
        const percentages = Object.values(subjectStats);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects,
                datasets: [{
                    label: 'Attendance Percentage by Subject',
                    data: percentages,
                    backgroundColor: percentages.map(p => 
                        p >= commonSystem.settings.attendanceThreshold ? '#2ecc71' : '#e74c3c'
                    ),
                    borderColor: '#34495e',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentage (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Subjects'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Attendance: ${context.parsed.y}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    // QR Code Scanner Methods
    async startQRScanner() {
        const startBtn = document.getElementById('start-qr-scanner');
        const stopBtn = document.getElementById('stop-qr-scanner');
        const qrReader = document.getElementById('qr-reader');
        const locationText = document.getElementById('location-text');
        
        // Clear previous scanner if any
        if (this.html5QrCode) {
            try {
                await this.html5QrCode.clear();
            } catch (e) {
                // Ignore clear errors
            }
        }
        
        // Clear reader container
        qrReader.innerHTML = '';
        
        // Initialize scanner
        this.html5QrCode = new Html5Qrcode("qr-reader");
        
        // Start scanning
        try {
            await this.html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText, decodedResult) => {
                    // Handle the scanned code
                    this.handleScannedCode(decodedText);
                },
                (errorMessage) => {
                    // Ignore common scanning errors
                    if (!errorMessage.includes('No QR code found') && !errorMessage.includes('NotFoundException')) {
                        console.log('Scanning...', errorMessage);
                    }
                }
            );
            
            // Update UI
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';
            qrReader.style.display = 'block';
            locationText.textContent = 'Scanner active - Point camera at QR code';
            
        } catch (error) {
            console.error('Error starting QR scanner:', error);
            const errorMsg = error.message || 'Failed to start QR scanner';
            if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
                locationText.textContent = 'Camera permission denied. Please allow camera access.';
            } else {
                locationText.textContent = 'Error: ' + errorMsg;
            }
            this.showScanMessage('Failed to start QR scanner. Please check camera permissions.', 'error');
        }
    }
    
    stopQRScanner() {
        if (this.html5QrCode) {
            this.html5QrCode.stop().then(() => {
                const startBtn = document.getElementById('start-qr-scanner');
                const stopBtn = document.getElementById('stop-qr-scanner');
                const locationText = document.getElementById('location-text');
                
                startBtn.style.display = 'block';
                stopBtn.style.display = 'none';
                locationText.textContent = 'Scanner stopped';
                
                // Clear the scanner view
                const qrReader = document.getElementById('qr-reader');
                if (qrReader) {
                    qrReader.innerHTML = '';
                }
            }).catch(err => {
                console.error('Error stopping QR scanner:', err);
            });
        }
    }
    
    showScanMessage(message, type = 'info') {
        const resultsDiv = document.getElementById('qr-reader-results');
        if (!resultsDiv) return;
        
        const color = type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db';
        resultsDiv.innerHTML = `<div style="padding: 15px; background: ${color}15; border-left: 4px solid ${color}; border-radius: 5px; margin: 15px 0; color: ${color}; font-weight: bold;">${message}</div>`;
        
        if (type === 'success') {
            setTimeout(() => {
                resultsDiv.innerHTML = '';
            }, 5000);
        }
    }
    
    showCameraScanner() {
        document.getElementById('camera-scanner-section').style.display = 'block';
        document.getElementById('upload-scanner-section').style.display = 'none';
        document.getElementById('camera-scan-btn').classList.add('active');
        document.getElementById('upload-scan-btn').classList.remove('active');
    }

    showUploadScanner() {
        document.getElementById('camera-scanner-section').style.display = 'none';
        document.getElementById('upload-scanner-section').style.display = 'block';
        document.getElementById('upload-scan-btn').classList.add('active');
        document.getElementById('camera-scan-btn').classList.remove('active');
        
        // Stop camera if running
        if (this.html5QrCode) {
            this.stopQRScanner();
        }
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const preview = document.getElementById('uploaded-image-preview');
        const processBtn = document.getElementById('process-uploaded-image');
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="QR Code Preview" style="max-width: 300px; max-height: 300px; border: 2px solid #4caf50; border-radius: 5px;">
            `;
            processBtn.style.display = 'block';
            this.uploadedImageFile = file;
        };
        reader.readAsDataURL(file);
    }

    async processUploadedImage() {
        if (!this.uploadedImageFile) {
            this.showScanMessage('Please select an image first.', 'error');
            return;
        }

        this.showScanMessage('Processing QR code image...', 'info');

        try {
            // Use Html5Qrcode to scan from file
            if (!this.html5QrCode) {
                this.html5QrCode = new Html5Qrcode("qr-reader");
            }

            const decodedText = await this.html5QrCode.scanFile(this.uploadedImageFile, true);
            
            if (decodedText) {
                this.handleScannedCode(decodedText);
            } else {
                this.showScanMessage('Could not read QR code from image. Please try another image.', 'error');
            }
        } catch (error) {
            console.error('Error processing image:', error);
            this.showScanMessage('Failed to process QR code image. Please ensure the image contains a valid QR code.', 'error');
        }
    }

    async handleScannedCode(decodedText) {
        try {
            console.log('Scanned QR code:', decodedText);
            
            // Parse the QR code data (JSON format)
            let qrData;
            try {
                qrData = JSON.parse(decodedText);
            } catch (e) {
                // Try parsing as URL-encoded or plain text format
                if (decodedText.includes('sessionId')) {
                    // Try to extract JSON from text
                    const jsonMatch = decodedText.match(/\{.*\}/);
                    if (jsonMatch) {
                        qrData = JSON.parse(jsonMatch[0]);
                    } else {
                        throw new Error('Invalid QR code format - not valid JSON');
                    }
                } else {
                    throw new Error('Invalid QR code format');
                }
            }
            
            const { sessionId, class: className, subject } = qrData;
            
            if (!sessionId || !className || !subject) {
                this.showScanMessage('Invalid QR code format. Please scan a valid attendance QR code.', 'error');
                console.error('Missing required fields:', { sessionId, className, subject });
                return;
            }
            
            console.log('QR Code data:', { sessionId, className, subject });
            
            // Check if session is valid and not expired
            const activeSessions = JSON.parse(localStorage.getItem('qr_active_sessions') || '{}');
            console.log('Active sessions:', activeSessions);
            console.log('Looking for sessionId:', sessionId);
            
            const session = activeSessions[sessionId];
            
            if (!session) {
                console.error('Session not found. Available sessions:', Object.keys(activeSessions));
                this.showScanMessage('QR code session not found or expired. Please ask your teacher for a new QR code.', 'error');
                return;
            }
            
            console.log('Found session:', session);
            
            // Check if session expired
            const now = new Date();
            const expiresAt = new Date(session.expiresAt);
            if (now > expiresAt) {
                this.showScanMessage('QR code has expired. Please ask your teacher for a new one.', 'error');
                return;
            }
            
            // Check if student is in the correct class (warning only, don't block)
            if (this.currentStudent.class && this.currentStudent.class !== className) {
                console.warn(`Class mismatch: student is in ${this.currentStudent.class}, QR is for ${className}`);
                // Allow attendance marking but log a warning
            }
            
            // Get session attendance list
            const sessionAttendanceKey = `qr_attendance_${sessionId}`;
            let attendanceList = JSON.parse(localStorage.getItem(sessionAttendanceKey) || '[]');
            
            // Check if already marked
            const studentId = this.currentStudent.studentId || this.currentStudent.username;
            const alreadyMarked = attendanceList.some(record => 
                record.studentId === studentId || 
                record.studentId === this.currentStudent.studentId ||
                record.studentId === this.currentStudent.username
            );
            
            if (alreadyMarked) {
                this.showScanMessage('You have already marked your attendance for this session!', 'error');
                return;
            }
            
            // Add attendance record to session
            const attendanceRecord = {
                studentId: studentId,
                studentName: this.currentStudent.name,
                timestamp: new Date().toISOString()
            };
            
            attendanceList.push(attendanceRecord);
            localStorage.setItem(sessionAttendanceKey, JSON.stringify(attendanceList));
            
            // Also save to main attendance data
            const today = new Date().toISOString().split('T')[0];
            const existingIndex = commonSystem.attendanceData.findIndex(record => 
                (record.studentId === studentId || 
                 record.studentId === this.currentStudent.studentId ||
                 record.studentId === this.currentStudent.username) &&
                record.class === className &&
                record.subject === subject &&
                record.date === today
            );
            
            const mainAttendanceRecord = {
                id: existingIndex !== -1 ? commonSystem.attendanceData[existingIndex].id : commonSystem.generateAttendanceId(),
                studentId: studentId,
                class: className,
                subject: subject,
                date: today,
                status: 'present',
                markedBy: session.teacher,
                markedAt: new Date().toISOString(),
                method: 'qr',
                sessionId: sessionId
            };
            
            if (existingIndex !== -1) {
                commonSystem.attendanceData[existingIndex] = mainAttendanceRecord;
            } else {
                commonSystem.attendanceData.push(mainAttendanceRecord);
            }
            
            commonSystem.saveAttendanceData();
            
            // Trigger storage event for real-time updates (works across tabs)
            localStorage.setItem('qr_attendance_marked', JSON.stringify({ 
                sessionId, 
                studentId,
                timestamp: new Date().toISOString()
            }));
            
            // Also trigger custom event for same-tab updates
            window.dispatchEvent(new CustomEvent('qrAttendanceUpdated', {
                detail: { sessionId, studentId, timestamp: new Date().toISOString() }
            }));
            
            // Stop scanner and show success
            this.stopQRScanner();
            this.showScanMessage('✓ Attendance marked successfully!', 'success');
            
            // Clear upload preview if exists
            const uploadPreview = document.getElementById('uploaded-image-preview');
            const uploadInput = document.getElementById('qr-image-upload');
            const processBtn = document.getElementById('process-uploaded-image');
            if (uploadPreview) uploadPreview.innerHTML = '';
            if (uploadInput) uploadInput.value = '';
            if (processBtn) processBtn.style.display = 'none';
            this.uploadedImageFile = null;
            
            // Refresh attendance data
            this.loadAttendanceSummary();
            this.loadAttendanceRecords();
            
            // Check for notifications
            commonSystem.checkLowAttendanceNotifications();
            
        } catch (error) {
            console.error('Error processing QR code:', error);
            this.showScanMessage('Invalid QR code. Please try scanning again.', 'error');
        }
    }

    loadNotifications() {
        const notifications = commonSystem.getStudentNotifications(this.currentStudent.studentId);
        const container = document.getElementById('notifications-list');
        
        if (notifications.length === 0) {
            container.innerHTML = '<p>No notifications.</p>';
            return;
        }

        let html = '';
        notifications.forEach(notification => {
            html += `
                <div class="notification-item ${notification.type}">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-date">${commonSystem.formatDate(notification.date)}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }
}

// Add CSS for status indicators
const style = document.createElement('style');
style.textContent = `
    .status-present { color: #2ecc71; font-weight: bold; }
    .status-absent { color: #e74c3c; font-weight: bold; }
    .status-late { color: #f39c12; font-weight: bold; }
    .notification-item {
        background: white;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 5px;
        border-left: 4px solid #3498db;
    }
    .notification-item.warning {
        border-left-color: #e74c3c;
    }
    .notification-message {
        font-weight: 500;
    }
    .notification-date {
        font-size: 0.9em;
        color: #7f8c8d;
        margin-top: 5px;
    }
`;
document.head.appendChild(style);

// Initialize student system
const studentSystem = new StudentSystem();