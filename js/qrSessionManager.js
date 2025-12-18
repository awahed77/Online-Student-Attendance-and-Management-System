// QR Code Session Management System
// Handles secure, session-based QR codes with expiry and one-time use
class QRSessionManager {
    constructor() {
        this.qrSessions = this.loadQRSessions();
        this.init();
    }

    init() {
        // Clean up expired QR sessions
        this.cleanupExpiredSessions();
        // Set up periodic cleanup every 5 minutes
        setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
    }

    loadQRSessions() {
        try {
            const sessions = localStorage.getItem('qr_sessions');
            if (!sessions) return {};
            const parsed = JSON.parse(sessions);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            console.error('Error loading QR sessions:', error);
            return {};
        }
    }

    saveQRSessions() {
        try {
            localStorage.setItem('qr_sessions', JSON.stringify(this.qrSessions));
        } catch (error) {
            console.error('Error saving QR sessions:', error);
        }
    }

    // Create a new QR code session
    createQRSession(teacherId, teacherUsername, className, subject, period) {
        const sessionToken = this.generateToken();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
        const createdAt = new Date().toISOString();

        const qrSession = {
            token: sessionToken,
            teacherId: teacherId,
            teacherUsername: teacherUsername,
            class: className,
            subject: subject,
            period: period,
            createdAt: createdAt,
            expiresAt: expiresAt.toISOString(),
            used: false,
            usedBy: null,
            usedAt: null
        };

        this.qrSessions[sessionToken] = qrSession;
        this.saveQRSessions();

        // Return QR data for encoding
        return {
            token: sessionToken,
            class: className,
            subject: subject,
            period: period,
            teacher: teacherUsername,
            expiresAt: expiresAt.toISOString(),
            createdAt: createdAt
        };
    }

    // Validate and use a QR code session
    validateAndUseQRToken(token, studentId) {
        // Reload from localStorage to get latest data
        this.qrSessions = this.loadQRSessions();
        
        const session = this.qrSessions[token];

        if (!session) {
            return { valid: false, error: 'Invalid QR code token' };
        }

        // Check if already used
        if (session.used) {
            return { valid: false, error: 'QR code has already been used' };
        }

        // Check if expired
        if (new Date(session.expiresAt) < new Date()) {
            return { valid: false, error: 'QR code has expired' };
        }

        // Mark as used
        session.used = true;
        session.usedBy = studentId;
        session.usedAt = new Date().toISOString();
        this.saveQRSessions();

        return {
            valid: true,
            session: {
                class: session.class,
                subject: session.subject,
                period: session.period,
                teacherId: session.teacherId,
                teacherUsername: session.teacherUsername
            }
        };
    }

    // Get QR session by token (for validation)
    getQRSession(token) {
        return this.qrSessions[token] || null;
    }

    // Cleanup expired QR sessions (older than 1 hour)
    cleanupExpiredSessions() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        Object.keys(this.qrSessions).forEach(token => {
            const session = this.qrSessions[token];
            const expiresAt = new Date(session.expiresAt);
            // Remove if expired more than 1 hour ago
            if (expiresAt < oneHourAgo) {
                delete this.qrSessions[token];
            }
        });
        this.saveQRSessions();
    }

    // Get active QR sessions for a teacher
    getTeacherQRSessions(teacherId) {
        return Object.values(this.qrSessions).filter(
            session => session.teacherId === teacherId && !session.used
        );
    }

    // Generate secure token
    generateToken() {
        const randomPart = Math.random().toString(36).substring(2, 15);
        const timePart = Date.now().toString(36);
        return `qrt_${timePart}_${randomPart}`;
    }
}

// Initialize QR session manager
const qrSessionManager = new QRSessionManager();

