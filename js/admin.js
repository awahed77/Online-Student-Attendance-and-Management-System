// Admin System
class AdminSystem {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.loadStudentManagement();
        this.loadUserManagement();
        this.setupEventListeners();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('#admin-dashboard .nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target.getAttribute('data-target');
                this.showSection(target);
            });
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('#admin-dashboard .content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('#admin-dashboard .nav-btn').forEach(button => {
            button.classList.remove('active');
        });
        
        // Show target section and activate button
        document.getElementById(sectionId).classList.add('active');
        document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');
    }

    setupEventListeners() {
        // Student management
        document.getElementById('add-student-btn').addEventListener('click', () => this.showAddStudentForm());
        
        // User management
        document.getElementById('add-user-btn').addEventListener('click', () => this.showAddUserForm());
        
        // Reports
        document.getElementById('generate-report-btn').addEventListener('click', () => this.generateReport());
        document.getElementById('export-pdf-btn').addEventListener('click', () => this.exportReportPDF());
        
        // Settings
        document.getElementById('save-settings').addEventListener('click', () => this.saveSystemSettings());
        
        this.populateClassFilters();
    }

    // Student Management
    loadStudentManagement() {
        const students = authSystem.users.filter(user => user.role === 'student');
        const container = document.getElementById('students-list');
        
        if (students.length === 0) {
            container.innerHTML = '<p>No students found.</p>';
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Class</th>
                        <th>Attendance %</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        students.forEach(student => {
            const attendancePercentage = commonSystem.calculateAttendancePercentage(student.studentId);
            html += `
                <tr>
                    <td>${student.studentId}</td>
                    <td>${student.name}</td>
                    <td>${student.class || 'Not assigned'}</td>
                    <td>${attendancePercentage}%</td>
                    <td>
                        <button onclick="adminSystem.editStudent(${student.id})" class="btn-secondary">Edit</button>
                        <button onclick="adminSystem.deleteStudent(${student.id})" class="logout-btn">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    showAddStudentForm() {
        const formHTML = `
            <form id="add-student-form">
                <div class="form-group">
                    <label for="student-name">Full Name:</label>
                    <input type="text" id="student-name" required>
                </div>
                <div class="form-group">
                    <label for="student-id">Student ID:</label>
                    <input type="text" id="student-id" required>
                </div>
                <div class="form-group">
                    <label for="student-class">Class:</label>
                    <select id="student-class" required>
                        <option value="">Select Class</option>
                        ${commonSystem.classes.map(cls => `<option value="${cls}">${cls}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="student-username">Username:</label>
                    <input type="text" id="student-username" required>
                </div>
                <div class="form-group">
                    <label for="student-password">Password:</label>
                    <input type="password" id="student-password" required>
                </div>
                <button type="submit" class="btn-primary">Add Student</button>
            </form>
        `;

        commonSystem.showModal('Add New Student', formHTML);
        
        document.getElementById('add-student-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudent();
        });
    }

    addStudent() {
        const studentData = {
            name: document.getElementById('student-name').value,
            studentId: document.getElementById('student-id').value,
            class: document.getElementById('student-class').value,
            username: document.getElementById('student-username').value,
            password: document.getElementById('student-password').value,
            role: 'student'
        };

        authSystem.createUser(studentData);
        commonSystem.hideModal();
        this.loadStudentManagement();
    }

    editStudent(userId) {
        const user = authSystem.users.find(u => u.id === userId);
        if (!user) return;

        const formHTML = `
            <form id="edit-student-form">
                <div class="form-group">
                    <label for="edit-student-name">Full Name:</label>
                    <input type="text" id="edit-student-name" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-student-id">Student ID:</label>
                    <input type="text" id="edit-student-id" value="${user.studentId}" required>
                </div>
                <div class="form-group">
                    <label for="edit-student-class">Class:</label>
                    <select id="edit-student-class" required>
                        <option value="">Select Class</option>
                        ${commonSystem.classes.map(cls => 
                            `<option value="${cls}" ${user.class === cls ? 'selected' : ''}>${cls}</option>`
                        ).join('')}
                    </select>
                </div>
                <button type="submit" class="btn-primary">Update Student</button>
            </form>
        `;

        commonSystem.showModal('Edit Student', formHTML);
        
        document.getElementById('edit-student-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateStudent(userId);
        });
    }

    updateStudent(userId) {
        const updates = {
            name: document.getElementById('edit-student-name').value,
            studentId: document.getElementById('edit-student-id').value,
            class: document.getElementById('edit-student-class').value
        };

        authSystem.updateUser(userId, updates);
        commonSystem.hideModal();
        this.loadStudentManagement();
    }

    deleteStudent(userId) {
        if (confirm('Are you sure you want to delete this student?')) {
            authSystem.deleteUser(userId);
            this.loadStudentManagement();
        }
    }

    // User Management
    loadUserManagement() {
        const users = authSystem.users;
        const container = document.getElementById('users-list');
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        users.forEach(user => {
            html += `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.name}</td>
                    <td>${user.role}</td>
                    <td>${commonSystem.formatDate(user.createdAt)}</td>
                    <td>
                        <button onclick="adminSystem.editUser(${user.id})" class="btn-secondary">Edit</button>
                        ${user.role !== 'admin' ? `<button onclick="adminSystem.deleteUser(${user.id})" class="logout-btn">Delete</button>` : ''}
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    showAddUserForm() {
        const formHTML = `
            <form id="add-user-form">
                <div class="form-group">
                    <label for="user-name">Full Name:</label>
                    <input type="text" id="user-name" required>
                </div>
                <div class="form-group">
                    <label for="user-username">Username:</label>
                    <input type="text" id="user-username" required>
                </div>
                <div class="form-group">
                    <label for="user-password">Password:</label>
                    <input type="password" id="user-password" required>
                </div>
                <div class="form-group">
                    <label for="user-role">Role:</label>
                    <select id="user-role" required>
                        <option value="">Select Role</option>
                        <option value="admin">Administrator</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                    </select>
                </div>
                <div id="student-fields" style="display: none;">
                    <div class="form-group">
                        <label for="user-student-id">Student ID:</label>
                        <input type="text" id="user-student-id">
                    </div>
                    <div class="form-group">
                        <label for="user-student-class">Class:</label>
                        <select id="user-student-class">
                            <option value="">Select Class</option>
                            ${commonSystem.classes.map(cls => `<option value="${cls}">${cls}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button type="submit" class="btn-primary">Create User</button>
            </form>
        `;

        commonSystem.showModal('Create User Account', formHTML);
        
        // Show/hide student fields based on role selection
        document.getElementById('user-role').addEventListener('change', function() {
            const studentFields = document.getElementById('student-fields');
            studentFields.style.display = this.value === 'student' ? 'block' : 'none';
        });
        
        document.getElementById('add-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addUser();
        });
    }

    addUser() {
        const userData = {
            name: document.getElementById('user-name').value,
            username: document.getElementById('user-username').value,
            password: document.getElementById('user-password').value,
            role: document.getElementById('user-role').value
        };

        if (userData.role === 'student') {
            userData.studentId = document.getElementById('user-student-id').value;
            userData.class = document.getElementById('user-student-class').value;
        }

        authSystem.createUser(userData);
        commonSystem.hideModal();
        this.loadUserManagement();
    }

    editUser(userId) {
        const user = authSystem.users.find(u => u.id === userId);
        if (!user) return;

        const formHTML = `
            <form id="edit-user-form">
                <div class="form-group">
                    <label for="edit-user-name">Full Name:</label>
                    <input type="text" id="edit-user-name" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label for="edit-user-username">Username:</label>
                    <input type="text" id="edit-user-username" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label for="edit-user-password">Password (leave blank to keep current):</label>
                    <input type="password" id="edit-user-password">
                </div>
                ${user.role === 'student' ? `
                    <div class="form-group">
                        <label for="edit-user-student-id">Student ID:</label>
                        <input type="text" id="edit-user-student-id" value="${user.studentId}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-user-class">Class:</label>
                        <select id="edit-user-class" required>
                            <option value="">Select Class</option>
                            ${commonSystem.classes.map(cls => 
                                `<option value="${cls}" ${user.class === cls ? 'selected' : ''}>${cls}</option>`
                            ).join('')}
                        </select>
                    </div>
                ` : ''}
                <button type="submit" class="btn-primary">Update User</button>
            </form>
        `;

        commonSystem.showModal('Edit User', formHTML);
        
        document.getElementById('edit-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateUser(userId);
        });
    }

    updateUser(userId) {
        const updates = {
            name: document.getElementById('edit-user-name').value,
            username: document.getElementById('edit-user-username').value
        };

        const password = document.getElementById('edit-user-password').value;
        if (password) {
            updates.password = password;
        }

        const user = authSystem.users.find(u => u.id === userId);
        if (user.role === 'student') {
            updates.studentId = document.getElementById('edit-user-student-id').value;
            updates.class = document.getElementById('edit-user-class').value;
        }

        authSystem.updateUser(userId, updates);
        commonSystem.hideModal();
        this.loadUserManagement();
    }

    deleteUser(userId) {
        if (confirm('Are you sure you want to delete this user?')) {
            authSystem.deleteUser(userId);
            this.loadUserManagement();
        }
    }

    // Reports
    populateClassFilters() {
        const classFilter = document.getElementById('report-class-filter');
        classFilter.innerHTML = '<option value="">All Classes</option>' +
            commonSystem.classes.map(cls => `<option value="${cls}">${cls}</option>`).join('');
    }

    generateReport() {
        const className = document.getElementById('report-class-filter').value;
        const month = document.getElementById('report-month-filter').value;
        
        let reportData;
        if (className && month) {
            reportData = commonSystem.generateMonthlyReport(className, month);
        } else {
            // Generate overall report
            reportData = this.generateOverallReport(className);
        }

        this.displayReport(reportData);
    }

    generateOverallReport(className = null) {
        const students = authSystem.users.filter(user => 
            user.role === 'student' && (!className || user.class === className)
        );

        const report = students.map(student => {
            const percentage = commonSystem.calculateAttendancePercentage(student.studentId);
            return {
                studentId: student.studentId,
                name: student.name,
                class: student.class,
                attendancePercentage: percentage,
                status: percentage >= commonSystem.settings.attendanceThreshold ? 'Satisfactory' : 'Low'
            };
        });

        return {
            type: 'overall',
            data: report,
            className: className || 'All Classes'
        };
    }

    displayReport(reportData) {
        const container = document.getElementById('report-results');
        
        if (reportData.type === 'overall') {
            let html = `<h3>Overall Attendance Report - ${reportData.className}</h3>`;
            html += `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Attendance %</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            reportData.data.forEach(student => {
                html += `
                    <tr>
                        <td>${student.studentId}</td>
                        <td>${student.name}</td>
                        <td>${student.class}</td>
                        <td>${student.attendancePercentage}%</td>
                        <td>${student.status}</td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        } else {
            // Monthly report display
            let html = `<h3>Monthly Report - ${reportData.className} (${reportData.month})</h3>`;
            html += `<p>Total Days: ${reportData.totalDays}</p>`;
            html += `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Total</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            reportData.studentStats.forEach(stats => {
                const student = authSystem.users.find(u => u.studentId === stats.studentId);
                html += `
                    <tr>
                        <td>${stats.studentId}</td>
                        <td>${stats.present}</td>
                        <td>${stats.absent}</td>
                        <td>${stats.total}</td>
                        <td>${stats.percentage}%</td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
            container.innerHTML = html;
        }
    }

    exportReportPDF() {
        const reportContent = document.getElementById('report-results').innerHTML;
        commonSystem.exportToPDF(reportContent, 'attendance_report.pdf');
    }

    // System Settings
    loadSystemSettings() {
        document.getElementById('attendance-threshold').value = commonSystem.settings.attendanceThreshold;
    }

    saveSystemSettings() {
        commonSystem.settings.attendanceThreshold = parseInt(document.getElementById('attendance-threshold').value);
        commonSystem.saveSettings();
        alert('Settings saved successfully!');
    }
}

// Initialize admin system
const adminSystem = new AdminSystem();