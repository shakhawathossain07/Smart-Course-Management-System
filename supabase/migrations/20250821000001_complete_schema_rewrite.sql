-- Complete database schema rewrite for Smart Course Management System
-- This migration creates a clean, production-ready database that works seamlessly with the frontend

-- Drop everything to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
DROP TRIGGER IF EXISTS update_submissions_updated_at ON submissions;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Remove from realtime publication first
ALTER publication supabase_realtime DROP TABLE IF EXISTS notifications;
ALTER publication supabase_realtime DROP TABLE IF EXISTS attendance_records;
ALTER publication supabase_realtime DROP TABLE IF EXISTS submissions;
ALTER publication supabase_realtime DROP TABLE IF EXISTS assignments;
ALTER publication supabase_realtime DROP TABLE IF EXISTS enrollments;
ALTER publication supabase_realtime DROP TABLE IF EXISTS courses;
ALTER publication supabase_realtime DROP TABLE IF EXISTS profiles;
ALTER publication supabase_realtime DROP TABLE IF EXISTS file_uploads;

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS grading_strategy CASCADE;
DROP TYPE IF EXISTS submission_status CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE notification_type AS ENUM ('assignment', 'announcement', 'attendance', 'grade');
CREATE TYPE grading_strategy AS ENUM ('percentage', 'letter-grade', 'pass-fail');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'late', 'graded');

-- Create profiles table (linked to auth.users)
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

-- Create courses table
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

-- Create submissions table
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

-- Create file_uploads table for tracking file uploads
CREATE TABLE file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'assignment', 'submission', 'profile', etc.
  entity_id uuid NOT NULL,
  public_url text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_student_id ON profiles(student_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_attendance_course ON attendance_records(course_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_file_uploads_entity ON file_uploads(entity_type, entity_id);
CREATE INDEX idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can view their own profile, admins can view all
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Users can update their own profile, admins can update any
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Only admins can delete profiles
CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Courses RLS policies
-- Everyone can view courses
CREATE POLICY "courses_select"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- Instructors can create courses, admins can create any
CREATE POLICY "courses_insert"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    instructor_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Instructors can update their own courses, admins can update any
CREATE POLICY "courses_update"
  ON courses FOR UPDATE
  TO authenticated
  USING (
    instructor_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    instructor_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Instructors can delete their own courses, admins can delete any
CREATE POLICY "courses_delete"
  ON courses FOR DELETE
  TO authenticated
  USING (
    instructor_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Enrollments RLS policies
-- Students can view their enrollments, instructors can view their course enrollments
CREATE POLICY "enrollments_select"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = enrollments.course_id AND instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can enroll themselves, instructors can enroll students in their courses
CREATE POLICY "enrollments_insert"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = enrollments.course_id AND instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can unenroll, instructors can manage their course enrollments
CREATE POLICY "enrollments_delete"
  ON enrollments FOR DELETE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = enrollments.course_id AND instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Assignments RLS policies
-- Students can view assignments for enrolled courses, instructors can view their assignments
CREATE POLICY "assignments_select"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.course_id = assignments.course_id 
      AND enrollments.student_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only instructors can create assignments for their courses
CREATE POLICY "assignments_insert"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only instructors can update their assignments
CREATE POLICY "assignments_update"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only instructors can delete their assignments
CREATE POLICY "assignments_delete"
  ON assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Submissions RLS policies
-- Students can view/manage their submissions, instructors can view/grade submissions for their assignments
CREATE POLICY "submissions_select"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = submissions.assignment_id 
      AND c.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can create their own submissions
CREATE POLICY "submissions_insert"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can update their own submissions, instructors can update (grade) submissions for their assignments
CREATE POLICY "submissions_update"
  ON submissions FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = submissions.assignment_id 
      AND c.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    student_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = submissions.assignment_id 
      AND c.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can delete their own submissions (if not graded)
CREATE POLICY "submissions_delete"
  ON submissions FOR DELETE
  TO authenticated
  USING (
    (student_id = auth.uid() AND graded_at IS NULL)
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Attendance records RLS policies
-- Students can view their attendance, instructors can manage attendance for their courses
CREATE POLICY "attendance_select"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = attendance_records.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only instructors can manage attendance for their courses
CREATE POLICY "attendance_insert"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = attendance_records.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "attendance_update"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = attendance_records.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = attendance_records.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "attendance_delete"
  ON attendance_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = attendance_records.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications RLS policies
-- Users can view their own notifications
CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Anyone can create notifications (for system notifications)
CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete"
  ON notifications FOR DELETE
  TO authenticated
  USING (recipient_id = auth.uid());

-- File uploads RLS policies
-- Users can view files they uploaded, or files related to entities they have access to
CREATE POLICY "file_uploads_select"
  ON file_uploads FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can upload files
CREATE POLICY "file_uploads_insert"
  ON file_uploads FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Users can update their own file records
CREATE POLICY "file_uploads_update"
  ON file_uploads FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Users can delete their own files
CREATE POLICY "file_uploads_delete"
  ON file_uploads FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

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
  -- Insert new profile with email from auth.users
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

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE profiles;
ALTER publication supabase_realtime ADD TABLE courses;
ALTER publication supabase_realtime ADD TABLE enrollments;
ALTER publication supabase_realtime ADD TABLE assignments;
ALTER publication supabase_realtime ADD TABLE submissions;
ALTER publication supabase_realtime ADD TABLE attendance_records;
ALTER publication supabase_realtime ADD TABLE notifications;
ALTER publication supabase_realtime ADD TABLE file_uploads;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create storage bucket for course files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course-files bucket
CREATE POLICY "Anyone can view course files" ON storage.objects
FOR SELECT USING (bucket_id = 'course-files');

CREATE POLICY "Authenticated users can upload course files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'course-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own course files" ON storage.objects
FOR UPDATE USING (bucket_id = 'course-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own course files" ON storage.objects
FOR DELETE USING (bucket_id = 'course-files' AND auth.uid()::text = (storage.foldername(name))[1]);
