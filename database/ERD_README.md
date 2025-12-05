# ERD Dummy Implementation

This is a standalone implementation of the ERD (Entity-Relationship Diagram) schema with dummy data. It is **NOT connected** to the current attendance system code.

## Files

1. **erd_dummy_implementation.js** - Main database implementation
2. **erd_test_queries.js** - Example queries to test the database
3. **ERD_README.md** - This documentation file

## Usage

### Loading the Database

Include the script in your HTML:

```html
<script src="database/erd_dummy_implementation.js"></script>
<script src="database/erd_test_queries.js"></script>
```

Or load in browser console after opening the page.

### Accessing the Database

The database is available as `erdDB` in the global scope:

```javascript
// Get all users
erdDB.getTable('Users');

// Find specific records
erdDB.findOne('Students', { student_id: 1 });

// Insert new record
erdDB.insert('Students', {
    user_id: 7,
    name: 'New Student',
    dob: '2005-01-01',
    enrollment_date: '2024-09-01'
});

// Update record
erdDB.update('Students', { student_id: 1 }, { name: 'Updated Name' });

// Delete record
erdDB.delete('Students', { student_id: 1 });
```

## Database Schema

The implementation includes all 15 tables from the ERD:

1. **SystemSettings** - System configuration
2. **Languages** - Supported languages
3. **Backups** - Database backup records
4. **Users** - User accounts (admin, teacher, student)
5. **Teachers** - Teacher-specific information
6. **Admins** - Admin-specific information
7. **Students** - Student-specific information
8. **Courses** - Course catalog
9. **Sections** - Course sections/classes
10. **ClassSessions** - Individual class sessions
11. **Enrollments** - Student enrollments in sections
12. **AttendanceRecords** - Attendance tracking records
13. **Notifications** - User notifications
14. **AuditLogs** - System audit trail
15. **Reports** - Generated reports

## Dummy Data

The database is pre-populated with:

- 2 Languages (English, Arabic)
- 6 Users (1 admin, 2 teachers, 3 students)
- 3 Courses (CS101, MATH201, ENG101)
- 4 Sections
- 6 Enrollments
- 4 Class Sessions
- 6 Attendance Records
- 2 Notifications
- 2 Audit Logs
- 2 Reports
- 2 Backups

## Example Queries

Use the `testQueries` object for common operations:

```javascript
// Get all users
testQueries.getAllUsers();

// Get student attendance
testQueries.getStudentAttendance(1);

// Get attendance percentage
testQueries.getStudentAttendancePercentage(1, 1);

// Get section enrollments
testQueries.getSectionEnrollments(1);

// Get section attendance statistics
testQueries.getSectionAttendanceStats(1);
```

## Helper Methods

The database includes helper methods:

- `getStudentWithUser(studentId)` - Get student with user info
- `getTeacherWithUser(teacherId)` - Get teacher with user info
- `getSectionWithCourse(sectionId)` - Get section with course and teacher info
- `getAttendanceForStudent(studentId, sectionId)` - Get attendance records for a student
- `calculateAttendancePercentage(studentId, sectionId)` - Calculate attendance percentage

## Storage

All data is stored in `localStorage` with the prefix `erd_db_`. This means:

- Data persists across page refreshes
- Data is isolated from other localStorage keys
- Each table is stored as a separate localStorage item

## Notes

- This is a **standalone implementation** - it does NOT interact with the existing attendance system
- All primary keys are auto-generated if not provided
- Timestamps are automatically added for relevant fields
- The database initializes and populates dummy data on first load
- Data persists in localStorage until cleared

## Clearing the Database

To clear all ERD database data:

```javascript
// Clear all ERD tables
const tables = ['SystemSettings', 'Languages', 'Backups', 'Users', 'Teachers', 
                'Admins', 'Students', 'Courses', 'Sections', 'ClassSessions', 
                'Enrollments', 'AttendanceRecords', 'Notifications', 'AuditLogs', 'Reports'];

tables.forEach(table => {
    localStorage.removeItem('erd_db_' + table);
});

// Reinitialize
const erdDB = new ERDDatabase();
```

