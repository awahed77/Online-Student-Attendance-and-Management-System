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
        
        // Check for geolocation support
        if ('geolocation' in navigator) {
            this.updateLocationStatus();
        } else {
            document.getElementById('location-text').textContent = 'Geolocation is not supported by your browser';
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
        const hasLocation = await this.updateLocationStatus();
        if (!hasLocation) {
            commonSystem.showNotification('Please enable location services to scan QR codes', 'error');
            return;
        }

        const startBtn = document.getElementById('start-qr-scanner');
        const stopBtn = document.getElementById('stop-qr-scanner');
        const qrReader = document.getElementById('qr-reader');
        
        // Clear previous scanner if any
        if (this.html5QrCode) {
            this.html5QrCode.clear();
        }
        
        // Initialize scanner
        this.html5QrCode = new Html5Qrcode("qr-reader");
        
        // Start scanning
        try {
            await this.html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: 250
                },
                (decodedText, decodedResult) => {
                    // Handle the scanned code
                    this.handleScannedCode(decodedText);
                },
                (errorMessage) => {
                    // Parse error, ignore if it's just because the scanner was stopped
                    if (errorMessage !== "QR code parse error, error = No QR code found.") {
                        console.error(errorMessage);
                    }
                }
            );
            
            // Update UI
            startBtn.style.display = 'none';
            stopBtn.style.display = 'block';
            qrReader.style.display = 'block';
            
        } catch (error) {
            console.error('Error starting QR scanner:', error);
            commonSystem.showNotification('Failed to start QR scanner. Please try again.', 'error');
        }
    }
    
    stopQRScanner() {
        if (this.html5QrCode) {
            this.html5QrCode.stop().then(ignore => {
                // QR Code scanning is stopped.
                const startBtn = document.getElementById('start-qr-scanner');
                const stopBtn = document.getElementById('stop-qr-scanner');
                
                startBtn.style.display = 'block';
                stopBtn.style.display = 'none';
                
                // Clear the scanner view
                document.getElementById('qr-reader').innerHTML = '';
            }).catch(err => {
                console.error('Error stopping QR scanner:', err);
            });
        }
    }
    
    async handleScannedCode(decodedText) {
        try {
            // Stop the scanner after successful scan
            this.stopQRScanner();
            
            // Parse the QR code data (assuming format: classId:subjectId:teacherId:timestamp:latitude:longitude)
            const [classId, subjectId, teacherId, timestamp, qrLat, qrLng] = decodedText.split(':');
            const qrLocation = {
                latitude: parseFloat(qrLat),
                longitude: parseFloat(qrLng)
            };
            
            // Verify location
            const distance = this.calculateDistance(
                this.currentLocation.latitude, 
                this.currentLocation.longitude,
                qrLocation.latitude,
                qrLocation.longitude
            );
            
            // If within 100 meters, mark attendance
            if (distance <= 100) { // 100 meters
                const currentTime = new Date();
                const qrTime = new Date(parseInt(timestamp));
                const timeDiffMinutes = (currentTime - qrTime) / (1000 * 60);
                
                if (timeDiffMinutes <= 15) { // Valid for 15 minutes
                    // Mark attendance
                    const attendanceRecord = {
                        studentId: this.currentStudent.studentId,
                        classId: classId,
                        subjectId: subjectId,
                        teacherId: teacherId,
                        date: currentTime.toISOString(),
                        status: 'present',
                        markedBy: 'QR Code',
                        location: this.currentLocation,
                        qrData: decodedText
                    };
                    
                    // Save attendance (in a real app, this would be an API call)
                    commonSystem.attendanceData.push(attendanceRecord);
                    commonSystem.saveData();
                    
                    // Show success message
                    commonSystem.showNotification('Attendance marked successfully!', 'success');
                    
                    // Refresh attendance data
                    this.loadAttendanceSummary();
                    this.loadAttendanceRecords();
                } else {
                    commonSystem.showNotification('QR code has expired. Please ask your teacher for a new one.', 'error');
                }
            } else {
                commonSystem.showNotification('You are too far from the class location to mark attendance.', 'error');
            }
        } catch (error) {
            console.error('Error processing QR code:', error);
            commonSystem.showNotification('Invalid QR code. Please try again.', 'error');
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