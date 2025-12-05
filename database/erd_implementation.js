/**
 * ERD Dummy Implementation
 * Standalone implementation of the ERD schema with dummy data
 * NOT connected to the current attendance system code
 */

class ERDDatabase {
    constructor() {
        this.prefix = 'erd_db_';
        this.init();
    }

    init() {
        // Initialize all tables from ERD
        this.ensureTable('SystemSettings');
        this.ensureTable('Languages');
        this.ensureTable('Backups');
        this.ensureTable('Users');
        this.ensureTable('Teachers');
        this.ensureTable('Admins');
        this.ensureTable('Students');
        this.ensureTable('Courses');
        this.ensureTable('Sections');
        this.ensureTable('ClassSessions');
        this.ensureTable('Enrollments');
        this.ensureTable('AttendanceRecords');
        this.ensureTable('Notifications');
        this.ensureTable('AuditLogs');
        this.ensureTable('Reports');
        
        // Populate with dummy data if tables are empty
        this.populateDummyData();
    }

    ensureTable(tableName) {
        const key = this.prefix + tableName;
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify([]));
        }
    }

    getTable(tableName) {
        const key = this.prefix + tableName;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    setTable(tableName, data) {
        const key = this.prefix + tableName;
        localStorage.setItem(key, JSON.stringify(data));
    }

    insert(tableName, record) {
        const table = this.getTable(tableName);
        const primaryKey = this.getPrimaryKey(tableName);
        
        // Auto-generate primary key if not provided
        if (!record[primaryKey]) {
            const maxId = table.length > 0 
                ? Math.max(...table.map(r => r[primaryKey] || 0))
                : 0;
            record[primaryKey] = maxId + 1;
        }
        
        // Add timestamps for certain fields
        if (tableName === 'Users' && !record.created_at) {
            record.created_at = new Date().toISOString();
        }
        if (tableName === 'SystemSettings' && !record.updated_at) {
            record.updated_at = new Date().toISOString();
        }
        if (tableName === 'Notifications' && !record.created_at) {
            record.created_at = new Date().toISOString();
        }
        if (tableName === 'AuditLogs' && !record.timestamp) {
            record.timestamp = new Date().toISOString();
        }
        if (tableName === 'Reports' && !record.generated_at) {
            record.generated_at = new Date().toISOString();
        }
        if (tableName === 'Backups' && !record.backup_time) {
            record.backup_time = new Date().toISOString();
        }
        if (tableName === 'Enrollments' && !record.enrolled_at) {
            record.enrolled_at = new Date().toISOString();
        }
        if (tableName === 'AttendanceRecords' && !record.recorded_at) {
            record.recorded_at = new Date().toISOString();
        }
        
        table.push(record);
        this.setTable(tableName, table);
        return record;
    }

    find(tableName, conditions = {}) {
        const table = this.getTable(tableName);
        if (Object.keys(conditions).length === 0) {
            return table;
        }
        return table.filter(record => {
            return Object.keys(conditions).every(key => record[key] === conditions[key]);
        });
    }

    findOne(tableName, conditions) {
        const results = this.find(tableName, conditions);
        return results.length > 0 ? results[0] : null;
    }

    update(tableName, conditions, updates) {
        const table = this.getTable(tableName);
        let updated = 0;
        
        table.forEach(record => {
            const matches = Object.keys(conditions).every(key => record[key] === conditions[key]);
            if (matches) {
                Object.assign(record, updates);
                updated++;
            }
        });
        
        if (updated > 0) {
            this.setTable(tableName, table);
        }
        return updated;
    }

    delete(tableName, conditions) {
        const table = this.getTable(tableName);
        const initialLength = table.length;
        const filtered = table.filter(record => {
            return !Object.keys(conditions).every(key => record[key] === conditions[key]);
        });
        this.setTable(tableName, filtered);
        return initialLength - filtered.length;
    }

    getPrimaryKey(tableName) {
        const primaryKeys = {
            'SystemSettings': 'setting_id',
            'Languages': 'lang_id',
            'Backups': 'backup_id',
            'Users': 'user_id',
            'Teachers': 'teacher_id',
            'Admins': 'admin_id',
            'Students': 'student_id',
            'Courses': 'course_id',
            'Sections': 'section_id',
            'ClassSessions': 'session_id',
            'Enrollments': 'enrollment_id',
            'AttendanceRecords': 'attendance_id',
            'Notifications': 'notification_id',
            'AuditLogs': 'log_id',
            'Reports': 'report_id'
        };
        return primaryKeys[tableName] || 'id';
    }

    populateDummyData() {
        // Only populate if tables are empty
        if (this.getTable('Users').length > 0) {
            return; // Already populated
        }

        // 1. SystemSettings
        this.insert('SystemSettings', {
            setting_id: 1,
            key: 'attendance_threshold',
            value: '75',
            description: 'Minimum attendance percentage required',
            updated_at: new Date().toISOString()
        });

        // 2. Languages
        this.insert('Languages', { lang_id: 1, code: 'en', name: 'English', is_active: true });
        this.insert('Languages', { lang_id: 2, code: 'ar', name: 'Arabic', is_active: true });

        // 3. Users (create users first, then role-specific records)
        const users = [
            { user_id: 1, username: 'admin1', password_hash: 'hash1', role: 'admin', email: 'admin1@school.edu', phone: '1234567890', created_at: '2024-01-01T00:00:00Z' },
            { user_id: 2, username: 'teacher1', password_hash: 'hash2', role: 'teacher', email: 'teacher1@school.edu', phone: '1234567891', created_at: '2024-01-01T00:00:00Z' },
            { user_id: 3, username: 'teacher2', password_hash: 'hash3', role: 'teacher', email: 'teacher2@school.edu', phone: '1234567892', created_at: '2024-01-01T00:00:00Z' },
            { user_id: 4, username: 'student1', password_hash: 'hash4', role: 'student', email: 'student1@school.edu', phone: '1234567893', created_at: '2024-01-01T00:00:00Z' },
            { user_id: 5, username: 'student2', password_hash: 'hash5', role: 'student', email: 'student2@school.edu', phone: '1234567894', created_at: '2024-01-01T00:00:00Z' },
            { user_id: 6, username: 'student3', password_hash: 'hash6', role: 'student', email: 'student3@school.edu', phone: '1234567895', created_at: '2024-01-01T00:00:00Z' }
        ];
        users.forEach(user => this.insert('Users', user));

        // 4. Admins
        this.insert('Admins', { admin_id: 1, user_id: 1, name: 'Admin One' });

        // 5. Teachers
        this.insert('Teachers', { teacher_id: 1, user_id: 2, name: 'Dr. John Smith', department: 'Computer Science' });
        this.insert('Teachers', { teacher_id: 2, user_id: 3, name: 'Prof. Jane Doe', department: 'Mathematics' });

        // 6. Students
        this.insert('Students', { student_id: 1, user_id: 4, name: 'Alice Johnson', dob: '2005-05-15', enrollment_date: '2023-09-01' });
        this.insert('Students', { student_id: 2, user_id: 5, name: 'Bob Williams', dob: '2005-07-20', enrollment_date: '2023-09-01' });
        this.insert('Students', { student_id: 3, user_id: 6, name: 'Charlie Brown', dob: '2005-03-10', enrollment_date: '2023-09-01' });

        // 7. Courses
        this.insert('Courses', { course_id: 1, course_code: 'CS101', course_name: 'Introduction to Computer Science', credits: 3, description: 'Basic programming concepts' });
        this.insert('Courses', { course_id: 2, course_code: 'MATH201', course_name: 'Calculus I', credits: 4, description: 'Differential and integral calculus' });
        this.insert('Courses', { course_id: 3, course_code: 'ENG101', course_name: 'English Composition', credits: 3, description: 'Writing and communication skills' });

        // 8. Sections
        this.insert('Sections', { section_id: 1, course_id: 1, section_code: 'CS101.A', teacher_id: 1, semester: 'Fall-2024', academic_year: 2024, max_capacity: 30, current_enrollment: 25 });
        this.insert('Sections', { section_id: 2, course_id: 1, section_code: 'CS101.B', teacher_id: 1, semester: 'Fall-2024', academic_year: 2024, max_capacity: 30, current_enrollment: 28 });
        this.insert('Sections', { section_id: 3, course_id: 2, section_code: 'MATH201.A', teacher_id: 2, semester: 'Fall-2024', academic_year: 2024, max_capacity: 25, current_enrollment: 22 });
        this.insert('Sections', { section_id: 4, course_id: 3, section_code: 'ENG101.A', teacher_id: 2, semester: 'Fall-2024', academic_year: 2024, max_capacity: 20, current_enrollment: 18 });

        // 9. Enrollments
        this.insert('Enrollments', { enrollment_id: 1, student_id: 1, section_id: 1, enrollment_status: 'Active', enrolled_at: '2024-09-01T00:00:00Z' });
        this.insert('Enrollments', { enrollment_id: 2, student_id: 1, section_id: 3, enrollment_status: 'Active', enrolled_at: '2024-09-01T00:00:00Z' });
        this.insert('Enrollments', { enrollment_id: 3, student_id: 2, section_id: 1, enrollment_status: 'Active', enrolled_at: '2024-09-01T00:00:00Z' });
        this.insert('Enrollments', { enrollment_id: 4, student_id: 2, section_id: 4, enrollment_status: 'Active', enrolled_at: '2024-09-01T00:00:00Z' });
        this.insert('Enrollments', { enrollment_id: 5, student_id: 3, section_id: 2, enrollment_status: 'Active', enrolled_at: '2024-09-01T00:00:00Z' });
        this.insert('Enrollments', { enrollment_id: 6, student_id: 3, section_id: 3, enrollment_status: 'Active', enrolled_at: '2024-09-01T00:00:00Z' });

        // 10. ClassSessions
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        this.insert('ClassSessions', { session_id: 1, section_id: 1, session_date: today, start_time: '09:00:00', end_time: '10:30:00', room: 'Room 101', session_type: 'Lecture', qr_code_token: 'qr_token_1', qr_expires_at: new Date(Date.now() + 1800000).toISOString() });
        this.insert('ClassSessions', { session_id: 2, section_id: 1, session_date: yesterday, start_time: '09:00:00', end_time: '10:30:00', room: 'Room 101', session_type: 'Lecture', qr_code_token: null, qr_expires_at: null });
        this.insert('ClassSessions', { session_id: 3, section_id: 3, session_date: today, start_time: '11:00:00', end_time: '12:30:00', room: 'Room 205', session_type: 'Lecture', qr_code_token: 'qr_token_2', qr_expires_at: new Date(Date.now() + 1800000).toISOString() });
        this.insert('ClassSessions', { session_id: 4, section_id: 2, session_date: today, start_time: '14:00:00', end_time: '15:30:00', room: 'Lab 301', session_type: 'Lab', qr_code_token: null, qr_expires_at: null });

        // 11. AttendanceRecords
        this.insert('AttendanceRecords', { attendance_id: 1, student_id: 1, session_id: 1, status: 'Present', recorded_at: new Date().toISOString(), recorded_by: 2, method: 'QR_Scan' });
        this.insert('AttendanceRecords', { attendance_id: 2, student_id: 2, session_id: 1, status: 'Present', recorded_at: new Date().toISOString(), recorded_by: 2, method: 'Manual' });
        this.insert('AttendanceRecords', { attendance_id: 3, student_id: 1, session_id: 2, status: 'Absent', recorded_at: yesterday + 'T10:00:00Z', recorded_by: 2, method: 'Manual' });
        this.insert('AttendanceRecords', { attendance_id: 4, student_id: 2, session_id: 2, status: 'Late', recorded_at: yesterday + 'T09:15:00Z', recorded_by: 2, method: 'Manual' });
        this.insert('AttendanceRecords', { attendance_id: 5, student_id: 1, session_id: 3, status: 'Present', recorded_at: new Date().toISOString(), recorded_by: 3, method: 'QR_Scan' });
        this.insert('AttendanceRecords', { attendance_id: 6, student_id: 3, session_id: 3, status: 'Present', recorded_at: new Date().toISOString(), recorded_by: 3, method: 'Manual' });

        // 12. Notifications
        this.insert('Notifications', { notification_id: 1, user_id: 4, title: 'Low Attendance Warning', message: 'Your attendance is 70%, which is below the required 75%', is_read: false, created_at: new Date().toISOString(), trigger_type: 'LOW_ATTENDANCE' });
        this.insert('Notifications', { notification_id: 2, user_id: 5, title: 'Class Reminder', message: 'You have a class in 30 minutes', is_read: true, created_at: new Date(Date.now() - 3600000).toISOString(), trigger_type: 'CLASS_REMINDER' });

        // 13. AuditLogs
        this.insert('AuditLogs', { log_id: 1, user_id: 1, action: 'CREATE', entity: 'Student', entity_id: 1, old_value: null, new_value: JSON.stringify({ name: 'Alice Johnson' }), timestamp: new Date().toISOString() });
        this.insert('AuditLogs', { log_id: 2, user_id: 2, action: 'UPDATE', entity: 'AttendanceRecord', entity_id: 1, old_value: JSON.stringify({ status: 'Absent' }), new_value: JSON.stringify({ status: 'Present' }), timestamp: new Date().toISOString() });

        // 14. Reports
        this.insert('Reports', { report_id: 1, generated_by: 2, report_type: 'Monthly', target_id: 1, format: 'PDF', generated_at: new Date(Date.now() - 86400000).toISOString(), file_path: '/reports/monthly_section1_2024_10.pdf' });
        this.insert('Reports', { report_id: 2, generated_by: 1, report_type: 'Student', target_id: 1, format: 'CSV', generated_at: new Date(Date.now() - 172800000).toISOString(), file_path: '/reports/student1_attendance.csv' });

        // 15. Backups
        this.insert('Backups', { backup_id: 1, backup_time: new Date(Date.now() - 604800000).toISOString(), file_path: '/backups/backup_2024_10_01.sql', size_mb: 15.5, status: 'Success' });
        this.insert('Backups', { backup_id: 2, backup_time: new Date(Date.now() - 1209600000).toISOString(), file_path: '/backups/backup_2024_09_24.sql', size_mb: 14.8, status: 'Success' });
    }

    // Helper methods for common queries
    getStudentWithUser(studentId) {
        const student = this.findOne('Students', { student_id: studentId });
        if (!student) return null;
        const user = this.findOne('Users', { user_id: student.user_id });
        return { ...student, user };
    }

    getTeacherWithUser(teacherId) {
        const teacher = this.findOne('Teachers', { teacher_id: teacherId });
        if (!teacher) return null;
        const user = this.findOne('Users', { user_id: teacher.user_id });
        return { ...teacher, user };
    }

    getSectionWithCourse(sectionId) {
        const section = this.findOne('Sections', { section_id: sectionId });
        if (!section) return null;
        const course = this.findOne('Courses', { course_id: section.course_id });
        const teacher = this.findOne('Teachers', { teacher_id: section.teacher_id });
        return { ...section, course, teacher };
    }

    getAttendanceForStudent(studentId, sectionId = null) {
        let records = this.find('AttendanceRecords', { student_id: studentId });
        
        if (sectionId) {
            const sessions = this.find('ClassSessions', { section_id: sectionId });
            const sessionIds = sessions.map(s => s.session_id);
            records = records.filter(r => sessionIds.includes(r.session_id));
        }
        
        return records.map(record => {
            const session = this.findOne('ClassSessions', { session_id: record.session_id });
            const section = session ? this.findOne('Sections', { section_id: session.section_id }) : null;
            const course = section ? this.findOne('Courses', { course_id: section.course_id }) : null;
            return { ...record, session, section, course };
        });
    }

    calculateAttendancePercentage(studentId, sectionId = null) {
        const records = this.getAttendanceForStudent(studentId, sectionId);
        if (records.length === 0) return 0;
        
        const presentCount = records.filter(r => r.status === 'Present').length;
        return Math.round((presentCount / records.length) * 100);
    }
}

// Initialize global ERD database instance
const erdDB = new ERDDatabase();

// Export for use in console or other scripts
if (typeof window !== 'undefined') {
    window.erdDB = erdDB;
    console.log('ERD Database initialized. Use erdDB to access the database.');
    console.log('Example: erdDB.getTable("Users")');
}

