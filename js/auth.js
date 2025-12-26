// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.init();
    }

    // Get current user from session manager
    getCurrentUser() {
        if (!this.currentUser) {
            this.currentUser = sessionManager.getCurrentUser();
        }
        return this.currentUser;
    }

    init() {
        this.setupLoginForm();
        this.checkExistingSession();
        this.updateCredentialsDisplay();
    }
    
    updateCredentialsDisplay() {
        // Update credentials display with actual users from system
        const users = this.loadUsers();
        const students = users.filter(u => u.role === 'student').slice(0, 5); // Show first 5 students
        const teachers = users.filter(u => u.role === 'teacher').slice(0, 3); // Show first 3 teachers
        
        const studentCard = document.querySelector('#login-credentials div[style*="border-left: 4px solid #10b981"]');
        if (studentCard && students.length > 1) {
            const studentList = students.map(s => 
                `<div style="margin-top: 5px;"><code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${s.username}</code> (${s.studentId || s.name})</div>`
            ).join('');
            const studentInfo = studentCard.querySelector('div[style*="font-size: 14px"]');
            if (studentInfo) {
                studentInfo.innerHTML = `
                    <div><strong>Sample Usernames:</strong></div>
                    ${studentList}
                    <div style="margin-top: 8px;"><strong>Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">student123</code></div>
                    <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
                        <em>Total: ${users.filter(u => u.role === 'student').length} students available</em>
                    </div>
                `;
            }
        }
        
        const teacherCard = document.querySelector('#login-credentials div[style*="border-left: 4px solid #6366f1"]');
        if (teacherCard && teachers.length > 1) {
            const teacherList = teachers.map(t => 
                `<div style="margin-top: 5px;"><code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${t.username}</code> (${t.name})</div>`
            ).join('');
            const teacherInfo = teacherCard.querySelector('div[style*="font-size: 14px"]');
            if (teacherInfo) {
                teacherInfo.innerHTML = `
                    <div><strong>Sample Usernames:</strong></div>
                    ${teacherList}
                    <div style="margin-top: 8px;"><strong>Password:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">teacher123</code></div>
                    <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
                        <em>Total: ${users.filter(u => u.role === 'teacher').length} teachers available</em>
                    </div>
                `;
            }
        }
    }

    loadUsers() {
        try {
            const defaultUsers = [
                { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'System Administrator' },
                { id: 2, username: 'teacher1', password: 'teacher123', role: 'teacher', name: 'John Smith' },
                { id: 3, username: 'student1', password: 'student123', role: 'student', name: 'Alice Johnson', studentId: 'S001' }
            ];
            
            const storedUsers = localStorage.getItem('attendance_users');
            if (storedUsers) {
                const parsed = JSON.parse(storedUsers);
                return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultUsers;
            }
            return defaultUsers;
        } catch (error) {
            console.error('Error loading users:', error);
            return [
                { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'System Administrator' },
                { id: 2, username: 'teacher1', password: 'teacher123', role: 'teacher', name: 'John Smith' },
                { id: 3, username: 'student1', password: 'student123', role: 'student', name: 'Alice Johnson', studentId: 'S001' }
            ];
        }
    }

    saveUsers() {
        try {
            localStorage.setItem('attendance_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Error saving users:', error);
            alert('Error saving user data. Please try again.');
        }
    }

    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Add click handlers for credential cards to auto-fill
        this.setupCredentialClickHandlers();
    }
    
    setupCredentialClickHandlers() {
        // Use a more reliable method - add data attributes or use setTimeout to ensure DOM is ready
        setTimeout(() => {
            const credentialsDiv = document.getElementById('login-credentials');
            if (!credentialsDiv) return;
            
            // Admin credentials - find by text content
            const cards = credentialsDiv.querySelectorAll('div[style*="border-left"]');
            cards.forEach(card => {
                const text = card.textContent;
                if (text.includes('Administrator') || text.includes('admin')) {
                    card.style.cursor = 'pointer';
                    card.style.transition = 'all 0.2s';
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'translateX(5px)';
                        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'translateX(0)';
                        card.style.boxShadow = 'none';
                    });
                    card.addEventListener('click', () => {
                        document.getElementById('username').value = 'admin';
                        document.getElementById('password').value = 'admin123';
                        document.getElementById('role').value = 'admin';
                    });
                } else if (text.includes('Teacher') || text.includes('teacher')) {
                    card.style.cursor = 'pointer';
                    card.style.transition = 'all 0.2s';
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'translateX(5px)';
                        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'translateX(0)';
                        card.style.boxShadow = 'none';
                    });
                    card.addEventListener('click', () => {
                        document.getElementById('username').value = 'teacher1';
                        document.getElementById('password').value = 'teacher123';
                        document.getElementById('role').value = 'teacher';
                    });
                } else if (text.includes('Student') || text.includes('student')) {
                    card.style.cursor = 'pointer';
                    card.style.transition = 'all 0.2s';
                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'translateX(5px)';
                        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    });
                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'translateX(0)';
                        card.style.boxShadow = 'none';
                    });
                    card.addEventListener('click', () => {
                        document.getElementById('username').value = 'student1';
                        document.getElementById('password').value = 'student123';
                        document.getElementById('role').value = 'student';
                    });
                }
            });
        }, 100);
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        const messageDiv = document.getElementById('login-message');

        const user = this.users.find(u => 
            u.username === username && 
            u.password === password && 
            u.role === role
        );

        if (user) {
            // Create session using session manager
            this.createSession(user);
            this.redirectToDashboard(user.role);
            this.showMessage('Login successful!', 'success', messageDiv);
        } else {
            this.showMessage('Invalid credentials or role selection', 'error', messageDiv);
        }
    }

    createSession(user) {
        // Use session manager for multi-session support
        const session = sessionManager.createSession(user);
        this.currentUser = user;
        return session;
    }

    checkExistingSession() {
        // Check for existing session using session manager
        const session = sessionManager.getCurrentSession();
        if (session) {
            const user = this.users.find(u => u.id === session.userId);
            if (user) {
                this.currentUser = user;
                this.redirectToDashboard(user.role);
            }
        }
    }

    redirectToDashboard(role) {
        // Hide all sections first
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show appropriate dashboard
        const dashboardId = `${role}-dashboard`;
        document.getElementById(dashboardId).classList.add('active');

        // Initialize dashboard
        this.initializeDashboard(role);
    }

    initializeDashboard(role) {
        switch(role) {
            case 'admin':
                if (typeof adminSystem !== 'undefined') adminSystem.init();
                break;
            case 'teacher':
                if (typeof teacherSystem !== 'undefined') teacherSystem.init();
                break;
            case 'student':
                if (typeof studentSystem !== 'undefined') studentSystem.init();
                break;
        }
    }

    logout() {
        // Use session manager to logout
        sessionManager.logout();
        this.currentUser = null;
        
        // Hide all dashboards and show login
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById('login-section').classList.add('active');
        
        // Clear login form
        document.getElementById('login-form').reset();
    }

    showMessage(message, type, container) {
        container.textContent = message;
        container.className = `message ${type}`;
        
        setTimeout(() => {
            container.textContent = '';
            container.className = 'message';
        }, 3000);
    }

    // User management methods for admin
    createUser(userData) {
        const newUser = {
            id: this.generateId(),
            ...userData,
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        this.saveUsers();
        return newUser;
    }

    updateUser(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.saveUsers();
            return this.users[userIndex];
        }
        return null;
    }

    deleteUser(userId) {
        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers();
    }

    generateId() {
        return Math.max(...this.users.map(u => u.id), 0) + 1;
    }
}

// Initialize authentication system
const authSystem = new AuthSystem();

// Setup logout buttons
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('admin-logout')?.addEventListener('click', () => authSystem.logout());
    document.getElementById('teacher-logout')?.addEventListener('click', () => authSystem.logout());
    document.getElementById('student-logout')?.addEventListener('click', () => authSystem.logout());
});