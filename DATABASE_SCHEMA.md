# Smart Course Management System - Database Schema Documentation

## Overview

This document provides comprehensive documentation for the updated database schema of the Smart Course Management System. The schema has been completely rewritten to ensure seamless compatibility with the frontend React application and includes all necessary features for a production-ready course management platform.

## Database Structure

### Core Tables

#### 1. `profiles` Table
Stores user information linked to Supabase Auth users.

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url text,
  student_id text UNIQUE,
  department text,
  gpa decimal(3,2) DEFAULT 0.0,
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Key Features:**
- Automatically created when users sign up via Supabase Auth
- Supports three roles: `admin`, `instructor`, `student`
- Includes academic information (GPA, student ID, department)
- Email field for consistent communication

#### 2. `courses` Table
Manages course information and instructor assignments.

```sql
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  code text UNIQUE,
  instructor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_name text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  max_students integer NOT NULL DEFAULT 30,
  credits integer NOT NULL DEFAULT 3,
  category text NOT NULL,
  features jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Key Features:**
- Course codes for easy identification (e.g., "CS301", "MATH202")
- Flexible course features stored as JSON (certificates, peer review, discussion forums)
- Instructor information cached for performance
- Date-based course scheduling

#### 3. `enrollments` Table
Many-to-many relationship between students and courses.

```sql
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);
```

**Key Features:**
- Prevents duplicate enrollments with unique constraint
- Tracks enrollment timestamps
- Cascading deletes maintain data integrity

#### 4. `assignments` Table
Comprehensive assignment management with rich metadata.

```sql
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  instructions text,
  due_date timestamptz NOT NULL,
  total_points integer NOT NULL DEFAULT 100,
  max_grade integer NOT NULL DEFAULT 100,
  grading_strategy grading_strategy DEFAULT 'percentage',
  attachments jsonb DEFAULT '[]',
  rubric jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Key Features:**
- Detailed instructions separate from description
- File attachments stored as JSON metadata
- Flexible grading strategies (percentage, letter grades, pass/fail)
- Rubric support for detailed grading criteria
- Assignment settings (late submissions, file restrictions, etc.)

#### 5. `submissions` Table
Student assignment submissions with comprehensive tracking.

```sql
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  student_name text,
  content text,
  grade integer,
  feedback text,
  status submission_status DEFAULT 'draft',
  files jsonb DEFAULT '[]',
  comments text,
  rubric_scores jsonb DEFAULT '{}',
  graded_by uuid REFERENCES profiles(id),
  submitted_at timestamptz DEFAULT now(),
  graded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);
```

**Key Features:**
- Status tracking: `draft`, `submitted`, `late`, `graded`
- File attachments with metadata
- Rubric-based scoring system
- Instructor feedback and comments
- Comprehensive audit trail

#### 6. `attendance_records` Table
Class attendance tracking system.

```sql
CREATE TABLE attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  marked_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, student_id, date)
);
```

**Key Features:**
- Three attendance statuses: `present`, `absent`, `late`
- Daily attendance tracking with unique constraints
- Instructor attribution for record keeping

#### 7. `notifications` Table
System-wide notification management.

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Key Features:**
- Typed notifications: `assignment`, `announcement`, `attendance`, `grade`
- Read/unread status tracking
- Targeted messaging to specific users

#### 8. `file_uploads` Table
File management and tracking system.

```sql
CREATE TABLE file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  public_url text,
  created_at timestamptz DEFAULT now()
);
```

**Key Features:**
- Generic file tracking for any entity type
- File metadata including size and MIME type
- Public URL generation for Supabase Storage
- Uploader attribution and audit trail

## Security & Permissions

### Row Level Security (RLS)

All tables implement comprehensive RLS policies to ensure data security:

#### Profile Access
- Users can view and edit their own profiles
- Admins can view and manage all profiles
- Public profile information available for course context

#### Course Management
- All authenticated users can view courses
- Instructors can manage their own courses
- Admins have full course management privileges

#### Assignment & Submission Security
- Students can only view assignments for enrolled courses
- Students can only manage their own submissions
- Instructors can view and grade submissions for their courses
- Cascading permissions through course enrollment

#### File Upload Security
- Users can only access files they uploaded
- Entity-based access control (assignments, submissions, etc.)
- Secure storage integration with Supabase Storage

### Authentication Integration

The system integrates seamlessly with Supabase Auth:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, department, student_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'),
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'student_id'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql;
```

## Performance Optimizations

### Indexes
Strategic indexes have been created for optimal query performance:

```sql
-- User lookups
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_student_id ON profiles(student_id);

-- Course management
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_code ON courses(code);

-- Assignment workflows
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- Attendance tracking
CREATE INDEX idx_attendance_course ON attendance_records(course_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);

-- File management
CREATE INDEX idx_file_uploads_entity ON file_uploads(entity_type, entity_id);
```

### Real-time Subscriptions

All tables are configured for real-time updates:

```sql
ALTER publication supabase_realtime ADD TABLE profiles;
ALTER publication supabase_realtime ADD TABLE courses;
ALTER publication supabase_realtime ADD TABLE assignments;
ALTER publication supabase_realtime ADD TABLE submissions;
ALTER publication supabase_realtime ADD TABLE notifications;
-- ... and all other tables
```

## Frontend Integration

### Type Definitions

The database schema is fully typed in TypeScript:

```typescript
export interface Database {
  public: {
    Tables: {
      assignments: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string;
          instructions: string | null;
          due_date: string;
          total_points: number;
          max_grade: number;
          grading_strategy: 'percentage' | 'letter-grade' | 'pass-fail';
          attachments: Json;
          rubric: Json;
          settings: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        // ... Insert and Update types
      };
      // ... other tables
    };
  };
}
```

### Service Layer Compatibility

All existing services (AssignmentService, CourseService, etc.) are fully compatible with the new schema structure. The schema includes all fields expected by the frontend components.

## Migration Strategy

The database uses a three-migration approach:

1. **`20250821000001_complete_schema_rewrite.sql`**: Complete schema rebuild
2. **`20250821000002_schema_updates.sql`**: Incremental updates and fixes
3. **`20250821000003_sample_data.sql`**: Sample data for testing and demos

## Testing & Validation

A comprehensive test script (`test-database.js`) validates:
- Database connectivity
- Table structure integrity
- Sample data population
- RLS policy functionality
- Real-time subscription setup

## Sample Data

The system includes realistic sample data:
- 1 Admin user
- 3 Instructor users
- 6 Student users
- 3 Courses with proper enrollment
- 4 Assignments with varied due dates
- Sample submissions with grades and feedback
- Attendance records
- Notifications for different event types
- File upload records

This comprehensive schema provides a solid foundation for the Smart Course Management System with full production readiness, security, and scalability.
