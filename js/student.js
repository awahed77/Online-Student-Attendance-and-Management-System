// Student System
class StudentSystem {
    constructor() {
        this.currentStudent = authSystem.getCurrentUser();
        this.attendanceChart = null;
        this.html5QrCode = null;
        this.currentLocation = null;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadStudentData();
        this.detectDeviceType();
    }
    
    detectDeviceType() {
        const deviceInfo = document.getElementById('device-type');
        if (!deviceInfo) return;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
        
        if (isMobile) {
            deviceInfo.textContent = '📱 Mobile Device Detected - Back camera will be used';
        } else {
            deviceInfo.textContent = '💻 PC/Desktop Detected - Webcam will be used (if available)';
        }
        
        if (!hasCamera) {
            deviceInfo.textContent += ' ⚠️ Camera API not available';
        }
    }
    
    processManualQRAlways() {
        const input = document.getElementById('manual-qr-input-always');
        if (!input || !input.value.trim()) {
            alert('Please enter QR code data.');
            return;
        }
        
        try {
            this.handleScannedCode(input.value.trim());
            input.value = '';
            alert('QR code processed successfully!');
        } catch (error) {
            alert('Error processing QR code: ' + error.message);
        }
    }
    
    // Process attendance using random code
    async processAttendanceCode() {
        const codeInput = document.getElementById('attendance-code-input');
        if (!codeInput) {
            alert('Code input field not found');
            return;
        }
        
        const code = codeInput.value.trim();
        
        if (!code || code.length !== 6) {
            alert('Please enter a valid 6-digit attendance code');
            codeInput.focus();
            return;
        }
        
        // Validate code using QR session manager
        const validation = qrSessionManager.validateAndUseByCode(code, this.currentStudent.studentId);
        
        if (!validation.valid) {
            alert(validation.error || 'Invalid or expired attendance code. Please check the code and try again.');
            codeInput.value = '';
            codeInput.focus();
            return;
        }
        
        const session = validation.session;
        const today = new Date().toISOString().split('T')[0];
        
        // Check if already marked
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        const existingIndex = commonSystem.attendanceData.findIndex(record => 
            record.studentId === this.currentStudent.studentId &&
            record.class === session.class &&
            record.subject === session.subject &&
            record.period === session.period &&
            record.date === today
        );
        
        if (existingIndex !== -1) {
            alert('Aap already is class ki attendance mark kar chuke hain!');
            codeInput.value = '';
            return;
        }
        
        // Get location if available
        let location = null;
        try {
            if ('geolocation' in navigator) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 60000
                    });
                });
                location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
            }
        } catch (e) {
            // Location not available, continue without it
        }
        
        // Mark attendance
        const attendanceRecord = {
            id: commonSystem.generateAttendanceId(),
            studentId: this.currentStudent.studentId,
            class: session.class,
            subject: session.subject,
            period: session.period,
            date: today,
            status: 'present',
            markedBy: session.teacherUsername,
            markedAt: new Date().toISOString(),
            method: 'code', // Mark as code-based attendance
            location: location,
            attendanceCode: code // Store the code used
        };
        
        // Save attendance
        commonSystem.attendanceData.push(attendanceRecord);
        commonSystem.saveAttendanceData();
        
        // Reload from localStorage
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        
        // Check notifications
        commonSystem.checkLowAttendanceNotifications();
        
        // Show success message
        alert(`✅ Attendance mark ho gayi!\n${session.subject} - ${session.class} - ${session.period}\n\nCode: ${code}`);
        
        // Clear input
        codeInput.value = '';
        
        // Reload all student data
        this.loadStudentData();
        
        // Refresh chart if statistics section is active
        const statsSection = document.getElementById('attendance-stats');
        if (statsSection && statsSection.classList.contains('active')) {
            this.loadAttendanceChart();
        }
        
        // Refresh notifications
        const notifSection = document.getElementById('notifications');
        if (notifSection && notifSection.classList.contains('active')) {
            this.loadNotifications();
        }
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('#student-dashboard .nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target.getAttribute('data-target');
                this.showSection(target);
                
                // Load section-specific data when switching
                if (target === 'attendance-stats') {
                    // Small delay to ensure section is visible
                    setTimeout(() => this.loadAttendanceChart(), 100);
                } else if (target === 'notifications') {
                    this.loadNotifications();
                } else if (target === 'my-attendance') {
                    this.loadStudentData();
                } else if (target === 'scan-qr') {
                    // Update location status when opening QR scanner
                    if ('geolocation' in navigator) {
                        this.updateLocationStatus();
                    }
                }
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
        // QR Code Scanner buttons
        const startQrBtn = document.getElementById('start-qr-scanner');
        const stopQrBtn = document.getElementById('stop-qr-scanner');
        
        if (startQrBtn) {
            startQrBtn.addEventListener('click', () => this.startQRScanner());
        }
        
        if (stopQrBtn) {
            stopQrBtn.addEventListener('click', () => this.stopQRScanner());
        }
        
        // Check for geolocation support
        const locationText = document.getElementById('location-text');
        if (locationText) {
            if ('geolocation' in navigator) {
                this.updateLocationStatus();
            } else {
                locationText.textContent = 'Geolocation is not supported by your browser';
            }
        }
    }

    loadStudentData() {
        this.loadAttendanceSummary();
        this.loadAttendanceRecords();
        this.loadNotifications();
    }

    loadAttendanceSummary() {
        // Reload data before calculating
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        
        const percentage = commonSystem.calculateAttendancePercentage(this.currentStudent.studentId);
        const percentageElement = document.getElementById('attendance-percentage');
        if (percentageElement) {
            percentageElement.textContent = `${percentage}%`;
            
            // Color code based on threshold
            if (percentage < commonSystem.settings.attendanceThreshold) {
                percentageElement.style.color = '#e74c3c';
            } else {
                percentageElement.style.color = '#2ecc71';
            }
        }
    }

    loadAttendanceRecords() {
        // Reload data before displaying
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        
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
                        <th>Period</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Marked By</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Sort by date, most recent first
        studentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        studentRecords.forEach(record => {
            const method = record.method === 'qr' ? '📱 QR Scan' : (record.method === 'code' ? '🔢 Code Entry' : '✍️ Manual');
            html += `
                <tr>
                    <td>${commonSystem.formatDate(record.date)}</td>
                    <td>${record.class}</td>
                    <td>${record.subject}</td>
                    <td>${record.period || 'N/A'}</td>
                    <td>
                        <span class="status-${record.status}">
                            ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                    </td>
                    <td>${method}</td>
                    <td>${record.markedBy}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    loadAttendanceChart() {
        // Reload data before generating chart
        commonSystem.attendanceData = commonSystem.loadAttendanceData();
        
        const canvas = document.getElementById('attendance-chart');
        if (!canvas) {
            console.error('Chart canvas not found');
            return;
        }
        
        // Destroy existing chart if it exists
        if (this.attendanceChart) {
            this.attendanceChart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const studentRecords = commonSystem.attendanceData.filter(record => 
            record.studentId === this.currentStudent.studentId
        );

        // Group by subject and calculate percentages
        const subjectStats = {};
        commonSystem.subjects.forEach(subject => {
            const subjectRecords = studentRecords.filter(record => record.subject === subject);
            if (subjectRecords.length > 0) {
                const presentCount = subjectRecords.filter(record => 
                    record.status === 'present' || record.status === 'late'
                ).length;
                const percentage = Math.round((presentCount / subjectRecords.length) * 100);
                subjectStats[subject] = percentage;
            }
        });

        const subjects = Object.keys(subjectStats);
        const percentages = Object.values(subjectStats);

        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            const container = canvas.parentElement;
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">Chart.js library not loaded. Please refresh the page.</p>';
            return;
        }

        // If no data, show message
        if (subjects.length === 0) {
            // Destroy any existing chart
            if (this.attendanceChart) {
                this.attendanceChart.destroy();
                this.attendanceChart = null;
            }
            // Show message
            const container = canvas.parentElement;
            const existingMsg = container.querySelector('.no-chart-data');
            if (!existingMsg) {
                const msg = document.createElement('p');
                msg.className = 'no-chart-data';
                msg.style.cssText = 'text-align: center; padding: 20px; color: #7f8c8d; margin-top: 20px;';
                msg.textContent = 'No attendance data available to display in chart.';
                container.appendChild(msg);
            }
            canvas.style.display = 'none';
            return;
        } else {
            // Remove no data message if it exists
            const existingMsg = canvas.parentElement.querySelector('.no-chart-data');
            if (existingMsg) {
                existingMsg.remove();
            }
            canvas.style.display = 'block';
        }

        this.attendanceChart = new Chart(ctx, {
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
                maintainAspectRatio: true,
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
                },
                animation: {
                    duration: 1000
                }
            }
        });
    }

    // QR Code Scanner Methods
    async updateLocationStatus() {
        const locationText = document.getElementById('location-text');
        locationText.textContent = 'Getting location...';
        
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });
            
            this.currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            locationText.textContent = `Location acquired (Accuracy: ${Math.round(this.currentLocation.accuracy)}m)`;
            return true;
        } catch (error) {
            console.error('Error getting location:', error);
            locationText.textContent = 'Error getting location. Please ensure location services are enabled.';
            return false;
        }
    }

    async startQRScanner() {
        console.log('Starting QR scanner...');
        
        // Check if Html5Qrcode is available
        if (typeof Html5Qrcode === 'undefined') {
            console.error('Html5Qrcode library not loaded');
            alert('QR Scanner library not loaded. Please refresh the page and try again.');
            this.showManualEntryOption();
            return;
        }

        const startBtn = document.getElementById('start-qr-scanner');
        const stopBtn = document.getElementById('stop-qr-scanner');
        const qrReader = document.getElementById('qr-reader');
        const locationText = document.getElementById('location-text');
        const resultsDiv = document.getElementById('qr-reader-results');
        
        if (!startBtn || !stopBtn || !qrReader) {
            alert('QR scanner elements not found. Please refresh the page.');
            return;
        }
        
        // Show loading message
        if (resultsDiv) {
            resultsDiv.innerHTML = '<p style="color: #3b82f6; text-align: center;">Initializing camera...</p>';
        }
        
        // Try to get location (but don't block if it fails)
        try {
            const hasLocation = await this.updateLocationStatus();
            if (!hasLocation) {
                if (locationText) {
                    locationText.textContent = 'Warning: Location not available. QR scanning may still work.';
                    locationText.style.color = '#f39c12';
                }
            }
        } catch (e) {
            console.warn('Location update failed:', e);
        }
        
        // Clear previous scanner if any
        if (this.html5QrCode) {
            try {
                await this.html5QrCode.clear();
                this.html5QrCode = null;
            } catch (e) {
                console.warn('Error clearing previous scanner:', e);
                this.html5QrCode = null;
            }
        }
        
        // Clear the reader div
        qrReader.innerHTML = '';
        
        // Detect device type and camera preference
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('Device type:', isMobile ? 'Mobile' : 'PC/Desktop');
        
        // Try to get available cameras first
        let cameraId = null;
        let facingMode = isMobile ? "environment" : "user";
        
        try {
            const devices = await Html5Qrcode.getCameras();
            console.log('Available cameras:', devices.length);
            
            if (devices.length === 0) {
                throw new Error('No cameras found');
            }
            
            // Prefer back camera on mobile, front camera on PC
            if (isMobile) {
                // Find back camera
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
                cameraId = backCamera ? backCamera.id : devices[devices.length - 1].id;
            } else {
                // Find front camera or webcam
                const frontCamera = devices.find(d => d.label.toLowerCase().includes('front') || d.label.toLowerCase().includes('webcam'));
                cameraId = frontCamera ? frontCamera.id : devices[0].id;
            }
            
            console.log('Selected camera:', cameraId);
        } catch (error) {
            console.warn('Could not enumerate cameras, using facingMode:', error);
            // Fallback to facingMode
        }
        
        // Initialize scanner
        try {
            this.html5QrCode = new Html5Qrcode("qr-reader");
            console.log('Html5Qrcode instance created');
            
            // Start scanning with camera ID or facingMode
            const config = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: facingMode };
            
            console.log('Starting scanner with config:', config);
            
            await this.html5QrCode.start(
                config,
                {
                    fps: 10,
                    qrbox: function(viewfinderWidth, viewfinderHeight) {
                        // Make QR box responsive
                        const minEdgePercentage = 0.7;
                        const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                        return {
                            width: qrboxSize,
                            height: qrboxSize
                        };
                    },
                    aspectRatio: 1.0,
                    disableFlip: false
                },
                (decodedText, decodedResult) => {
                    // Success callback
                    console.log('QR Code scanned:', decodedText);
                    this.handleScannedCode(decodedText);
                },
                (errorMessage) => {
                    // Error callback - this runs continuously while scanning
                    // Only log errors that aren't "not found" (which is normal)
                    if (!errorMessage.includes('NotFoundException')) {
                        // Don't spam console with scanning errors
                    }
                }
            );
            
            console.log('Scanner started successfully');
            
            // Update UI
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';
            qrReader.style.display = 'block';
            
            // Show success message with device-specific instructions
            if (resultsDiv) {
                const deviceMsg = isMobile 
                    ? '✅ Scanner is active! Point your phone camera at the QR code.'
                    : '✅ Scanner is active! Point your webcam at the QR code.';
                resultsDiv.innerHTML = `<p style="color: #10b981; text-align: center; font-weight: 600;">${deviceMsg}</p>`;
            }
            
        } catch (error) {
            console.error('Error starting QR scanner:', error);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            
            let errorMsg = 'Failed to start QR scanner.\n\n';
            let detailedMsg = '';
            
            if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
                errorMsg += '❌ Camera permission denied.\n';
                detailedMsg = 'Please:\n1. Click the camera icon in your browser\'s address bar\n2. Allow camera access\n3. Refresh the page and try again';
            } else if (error.message.includes('not found') || error.message.includes('No devices found') || error.message.includes('NotFoundError')) {
                errorMsg += '❌ No camera found.\n';
                detailedMsg = isMobile 
                    ? 'Please check that your device has a camera and it\'s not being used by another app.'
                    : 'No webcam detected. Please use the "Enter QR Code Manually" option below.';
            } else if (error.message.includes('NotReadableError') || error.message.includes('TrackStartError')) {
                errorMsg += '❌ Camera is already in use.\n';
                detailedMsg = 'Another application is using your camera. Please close it and try again.';
            } else {
                errorMsg += `❌ Error: ${error.message}\n`;
                detailedMsg = 'Please try:\n1. Refreshing the page\n2. Using manual entry option\n3. Checking browser console for details';
            }
            
            alert(errorMsg + '\n' + detailedMsg);
            
            // Show manual entry option
            this.showManualEntryOption();
            
            // Reset UI
            startBtn.style.display = 'block';
            stopBtn.style.display = 'none';
            if (resultsDiv) {
                resultsDiv.innerHTML = `<p style="color: #ef4444; text-align: center;">❌ Scanner failed to start. Use manual entry below.</p>`;
            }
        }
    }
    
    showManualEntryOption() {
        const resultsDiv = document.getElementById('qr-reader-results');
        if (resultsDiv) {
            const existing = resultsDiv.querySelector('#manual-entry-section');
            if (!existing) {
                const manualSection = document.createElement('div');
                manualSection.id = 'manual-entry-section';
                manualSection.style.cssText = 'margin-top: 20px; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;';
                manualSection.innerHTML = `
                    <h3 style="margin-bottom: 10px;">📝 Alternative: Enter QR Code Manually</h3>
                    <p style="color: #92400e; margin-bottom: 15px;">If your camera is not available, you can paste the QR code data here:</p>
                    <textarea id="manual-qr-input" placeholder='Paste QR code JSON data here (e.g., {"token":"...","class":"Class 01","subject":"CS301 - Data Structures and Algorithms","period":"Period 1"})' style="width: 100%; min-height: 100px; padding: 10px; border: 1px solid #d1d5db; border-radius: 5px; font-family: monospace; font-size: 12px;"></textarea>
                    <button onclick="studentSystem.processManualQR()" class="btn-primary" style="margin-top: 10px;">✅ Submit QR Code</button>
                `;
                resultsDiv.appendChild(manualSection);
            }
        }
    }
    
    processManualQR() {
        const input = document.getElementById('manual-qr-input');
        if (!input || !input.value.trim()) {
            alert('Please enter QR code data.');
            return;
        }
        
        try {
            console.log('Processing manual QR code input');
            this.handleScannedCode(input.value.trim());
            input.value = '';
        } catch (error) {
            console.error('Error processing manual QR code:', error);
            alert('Error processing QR code: ' + error.message);
        }
    }
    
    stopQRScanner() {
        if (this.html5QrCode) {
            this.html5QrCode.stop().then(ignore => {
                // QR Code scanning is stopped
                const startBtn = document.getElementById('start-qr-scanner');
                const stopBtn = document.getElementById('stop-qr-scanner');
                const qrReader = document.getElementById('qr-reader');
                const resultsDiv = document.getElementById('qr-reader-results');
                
                if (startBtn) startBtn.style.display = 'block';
                if (stopBtn) stopBtn.style.display = 'none';
                if (qrReader) qrReader.innerHTML = '';
                if (resultsDiv) resultsDiv.innerHTML = '';
                
                // Clear the scanner instance
                this.html5QrCode = null;
            }).catch(err => {
                console.error('Error stopping QR scanner:', err);
                // Force clear even if stop fails
                const startBtn = document.getElementById('start-qr-scanner');
                const stopBtn = document.getElementById('stop-qr-scanner');
                const qrReader = document.getElementById('qr-reader');
                
                if (startBtn) startBtn.style.display = 'block';
                if (stopBtn) stopBtn.style.display = 'none';
                if (qrReader) qrReader.innerHTML = '';
                this.html5QrCode = null;
            });
        } else {
            // If scanner wasn't initialized, just reset UI
            const startBtn = document.getElementById('start-qr-scanner');
            const stopBtn = document.getElementById('stop-qr-scanner');
            const qrReader = document.getElementById('qr-reader');
            
            if (startBtn) startBtn.style.display = 'block';
            if (stopBtn) stopBtn.style.display = 'none';
            if (qrReader) qrReader.innerHTML = '';
        }
    }
    
    async handleScannedCode(decodedText) {
        try {
            // Stop the scanner after successful scan
            this.stopQRScanner();
            
            // Parse the QR code data (JSON format)
            let qrData;
            try {
                qrData = JSON.parse(decodedText);
            } catch (e) {
                alert('Invalid QR code format. Please scan a valid attendance QR code.');
                return;
            }
            
            // Validate QR code has token
            if (!qrData.token) {
                alert('Invalid QR code. Missing security token.');
                return;
            }
            
            // Validate and use QR token using QR session manager
            const validation = qrSessionManager.validateAndUseQRToken(
                qrData.token,
                this.currentStudent.studentId
            );
            
            if (!validation.valid) {
                alert(validation.error || 'QR code is invalid or expired.');
                return;
            }
            
            const session = validation.session;
            const today = new Date().toISOString().split('T')[0];
            
            // Check if already marked (double-check)
            const existingIndex = commonSystem.attendanceData.findIndex(record => 
                record.studentId === this.currentStudent.studentId &&
                record.class === session.class &&
                record.subject === session.subject &&
                record.period === session.period &&
                record.date === today
            );
            
            if (existingIndex !== -1) {
                alert('You have already marked attendance for this class period today!');
                return;
            }
            
            // Mark attendance
            const attendanceRecord = {
                id: commonSystem.generateAttendanceId(),
                studentId: this.currentStudent.studentId,
                class: session.class,
                subject: session.subject,
                period: session.period,
                date: today,
                status: 'present',
                markedBy: session.teacherUsername,
                markedAt: new Date().toISOString(),
                method: 'qr',
                location: this.currentLocation || null,
                qrToken: qrData.token // Store token for audit
            };
            
            // Reload attendance data before saving
            commonSystem.attendanceData = commonSystem.loadAttendanceData();
            
            // Save attendance
            commonSystem.attendanceData.push(attendanceRecord);
            commonSystem.saveAttendanceData();
            
            // Reload from localStorage to ensure sync
            commonSystem.attendanceData = commonSystem.loadAttendanceData();
            
            // Check notifications
            commonSystem.checkLowAttendanceNotifications();
            
            // Show success message
            alert(`Attendance marked successfully!\n${session.subject} - ${session.class} - ${session.period}`);
            
            // Reload all student data in real-time
            this.loadStudentData();
            
            // Refresh chart if statistics section is active
            const statsSection = document.getElementById('attendance-stats');
            if (statsSection && statsSection.classList.contains('active')) {
                this.loadAttendanceChart();
            }
            
            // Refresh notifications if notifications section is active
            const notifSection = document.getElementById('notifications');
            if (notifSection && notifSection.classList.contains('active')) {
                this.loadNotifications();
            }
            
        } catch (error) {
            console.error('Error processing QR code:', error);
            alert('Error processing QR code. Please try again.');
        }
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula to calculate distance between two points on Earth
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    }

    loadNotifications() {
        // Refresh notifications first
        commonSystem.checkLowAttendanceNotifications();
        
        const notifications = commonSystem.getStudentNotifications(this.currentStudent.studentId);
        const container = document.getElementById('notifications-list');
        
        if (!container) {
            console.error('Notifications container not found');
            return;
        }
        
        // Sort notifications by date (newest first)
        const sortedNotifications = [...notifications].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        if (sortedNotifications.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px; color: #7f8c8d;">No notifications at this time.</p>';
            return;
        }

        let html = '';
        sortedNotifications.forEach(notification => {
            const date = new Date(notification.date);
            const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Add subject and class info if available
            let subjectInfo = '';
            if (notification.subject) {
                subjectInfo = `<div style="margin-top: 8px; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 13px;">
                    <strong>Subject:</strong> ${notification.subject}${notification.class ? ` | <strong>Class:</strong> ${notification.class}` : ''}
                </div>`;
            }
            
            html += `
                <div class="notification-item ${notification.type || 'info'}">
                    <div class="notification-message">${notification.message}</div>
                    ${subjectInfo}
                    <div class="notification-date">${dateStr}</div>
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

// Helper function to reload student data (can be called from other modules)
window.refreshStudentData = function() {
    if (typeof studentSystem !== 'undefined' && studentSystem) {
        studentSystem.loadStudentData();
        // If statistics section is active, refresh chart
        const statsSection = document.getElementById('attendance-stats');
        if (statsSection && statsSection.classList.contains('active')) {
            studentSystem.loadAttendanceChart();
        }
        // If notifications section is active, refresh notifications
        const notifSection = document.getElementById('notifications');
        if (notifSection && notifSection.classList.contains('active')) {
            studentSystem.loadNotifications();
        }
    }
};

// Initialize student system
const studentSystem = new StudentSystem();