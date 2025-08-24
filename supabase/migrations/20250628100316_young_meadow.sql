-- Complete database setup for Smart Course Management System
-- This migration fixes all authentication and permission issues

-- Drop everything to start completely fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS grading_strategy CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE notification_type AS ENUM ('assignment', 'announcement', 'attendance', 'grade');
CREATE TYPE grading_strategy AS ENUM ('percentage', 'letter-grade', 'pass-fail');

-- Create profiles table (linked to auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url text,
  student_id text UNIQUE,
  department text,
  gpa decimal(3,2) DEFAULT 0.0,
  permissions text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create courses table
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  max_students integer NOT NULL DEFAULT 30,
  credits integer NOT NULL DEFAULT 3,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create enrollments table (many-to-many: students <-> courses)
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Create assignments table
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  due_date timestamptz NOT NULL,
  max_grade integer NOT NULL DEFAULT 100,
  grading_strategy grading_strategy DEFAULT 'percentage',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create submissions table
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  grade integer,
  feedback text,
  submitted_at timestamptz DEFAULT now(),
  graded_at timestamptz,
  UNIQUE(assignment_id, student_id)
);

-- Create attendance records table
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

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_attendance_course ON attendance_records(course_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies (simple and secure)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Courses RLS policies
CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can manage their courses"
  ON courses FOR ALL
  TO authenticated
  USING (instructor_id = auth.uid());

CREATE POLICY "Admins can manage all courses"
  ON courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enrollments RLS policies
CREATE POLICY "Students can view their enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Students can enroll themselves"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Instructors can view their course enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = enrollments.course_id AND instructor_id = auth.uid()
    )
  );

-- Assignments RLS policies
CREATE POLICY "Students can view assignments for enrolled courses"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = assignments.course_id AND enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage assignments for their courses"
  ON assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id AND courses.instructor_id = auth.uid()
    )
  );

-- Submissions RLS policies
CREATE POLICY "Students can manage their own submissions"
  ON submissions FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can view submissions for their assignments"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = submissions.assignment_id AND c.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can grade submissions for their assignments"
  ON submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = submissions.assignment_id AND c.instructor_id = auth.uid()
    )
  );

-- Attendance RLS policies
CREATE POLICY "Students can view their attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can manage attendance for their courses"
  ON attendance_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = attendance_records.course_id AND courses.instructor_id = auth.uid()
    )
  );

-- Notifications RLS policies
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

-- Create utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profile management function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert new profile
  INSERT INTO public.profiles (id, name, role, department, student_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'),
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'student_id'
  );
  
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists - this is fine
    RETURN new;
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;