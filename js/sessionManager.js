// Multi-Session Management System
// Allows multiple users (teacher + student) to be logged in simultaneously
class SessionManager {
    constructor() {
        this.activeSessions = this.loadActiveSessions();
        this.init();
    }

    init() {
        // Clean up expired sessions on load
        this.cleanupExpiredSessions();
        // Set up periodic cleanup
        setInterval(() => this.cleanupExpiredSessions(), 60000); // Every minute
    }

    loadActiveSessions() {
        try {
            const sessions = localStorage.getItem('active_sessions');
            if (!sessions) return {};
            const parsed = JSON.parse(sessions);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            console.error('Error loading active sessions:', error);
            return {};
        }
    }

    saveActiveSessions() {
        try {
            localStorage.setItem('active_sessions', JSON.stringify(this.activeSessions));
        } catch (error) {
            console.error('Error saving active sessions:', error);
        }
    }

    // Create a new session for a user
    createSession(user, windowId = null) {
        if (!windowId) {
            windowId = this.generateWindowId();
        }

        const sessionId = this.generateSessionId();
        const session = {
            sessionId: sessionId,
            userId: user.id,
            username: user.username,
            role: user.role,
            windowId: windowId,
            loginTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        // Store in active sessions
        if (!this.activeSessions[user.id]) {
            this.activeSessions[user.id] = [];
        }
        this.activeSessions[user.id].push(session);
        this.saveActiveSessions();

        // Store current session in sessionStorage (window-specific)
        sessionStorage.setItem('current_session_id', sessionId);
        sessionStorage.setItem('current_user_id', user.id);
        sessionStorage.setItem('current_window_id', windowId);

        return session;
    }

    // Get current session for this window
    getCurrentSession() {
        const sessionId = sessionStorage.getItem('current_session_id');
        const userId = sessionStorage.getItem('current_user_id');
        
        if (!sessionId || !userId) {
            return null;
        }

        const userSessions = this.activeSessions[userId];
        if (!userSessions) {
            return null;
        }

        const session = userSessions.find(s => s.sessionId === sessionId);
        if (session && new Date(session.expiresAt) > new Date()) {
            // Update last activity
            session.lastActivity = new Date().toISOString();
            this.saveActiveSessions();
            return session;
        }

        return null;
    }

    // Get user from current session
    getCurrentUser() {
        const session = this.getCurrentSession();
        if (!session) {
            return null;
        }

        const users = JSON.parse(localStorage.getItem('attendance_users') || '[]');
        return users.find(u => u.id === session.userId) || null;
    }

    // Check if user has active session (any window)
    hasActiveSession(userId) {
        const userSessions = this.activeSessions[userId];
        if (!userSessions || userSessions.length === 0) {
            return false;
        }

        // Filter out expired sessions
        const active = userSessions.filter(s => new Date(s.expiresAt) > new Date());
        this.activeSessions[userId] = active;
        this.saveActiveSessions();

        return active.length > 0;
    }

    // Logout from current session
    logout(sessionId = null) {
        if (!sessionId) {
            sessionId = sessionStorage.getItem('current_session_id');
        }

        const userId = sessionStorage.getItem('current_user_id');
        if (userId && this.activeSessions[userId]) {
            this.activeSessions[userId] = this.activeSessions[userId].filter(
                s => s.sessionId !== sessionId
            );
            if (this.activeSessions[userId].length === 0) {
                delete this.activeSessions[userId];
            }
            this.saveActiveSessions();
        }

        // Clear sessionStorage
        sessionStorage.removeItem('current_session_id');
        sessionStorage.removeItem('current_user_id');
        sessionStorage.removeItem('current_window_id');
    }

    // Cleanup expired sessions
    cleanupExpiredSessions() {
        const now = new Date();
        Object.keys(this.activeSessions).forEach(userId => {
            this.activeSessions[userId] = this.activeSessions[userId].filter(
                s => new Date(s.expiresAt) > now
            );
            if (this.activeSessions[userId].length === 0) {
                delete this.activeSessions[userId];
            }
        });
        this.saveActiveSessions();
    }

    // Generate unique session ID
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Generate unique window ID
    generateWindowId() {
        return 'win_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get all active sessions for a user (for admin purposes)
    getUserSessions(userId) {
        return this.activeSessions[userId] || [];
    }
}

// Initialize session manager
const sessionManager = new SessionManager();

