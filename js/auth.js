// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.init();
    }

    init() {
        this.setupLoginForm();
        this.checkExistingSession();
    }

    loadUsers() {
        const defaultUsers = [
            { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'System Administrator' },
            { id: 2, username: 'teacher1', password: 'teacher123', role: 'teacher', name: 'John Smith' },
            { id: 3, username: 'student1', password: 'student123', role: 'student', name: 'Alice Johnson', studentId: 'S001' }
        ];
        
        const storedUsers = localStorage.getItem('attendance_users');
        return storedUsers ? JSON.parse(storedUsers) : defaultUsers;
    }

    saveUsers() {
        localStorage.setItem('attendance_users', JSON.stringify(this.users));
    }

    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
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
            this.currentUser = user;
            this.createSession(user);
            this.redirectToDashboard(user.role);
            this.showMessage('Login successful!', 'success', messageDiv);
        } else {
            this.showMessage('Invalid credentials or role selection', 'error', messageDiv);
        }
    }

    createSession(user) {
        const session = {
            userId: user.id,
            username: user.username,
            role: user.role,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('current_session', JSON.stringify(session));
    }

    checkExistingSession() {
        const session = localStorage.getItem('current_session');
        if (session) {
            const sessionData = JSON.parse(session);
            const user = this.users.find(u => u.id === sessionData.userId);
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
        this.currentUser = null;
        localStorage.removeItem('current_session');
        
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