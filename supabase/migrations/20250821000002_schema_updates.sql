/*
  # Updated Schema for Smart Course Management System
  
  This migration updates the existing schema to fix compatibility issues
  with the frontend and adds missing fields and tables.
*/

-- Add missing columns to existing tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Update assignments table to match frontend expectations
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS instructions text;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 100;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rubric jsonb DEFAULT '{}';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);

-- Update courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_name text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]';

-- Add submission status enum if not exists
DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'late', 'graded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update submissions table to match frontend expectations
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS student_name text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status submission_status DEFAULT 'draft';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS files jsonb DEFAULT '[]';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS comments text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS rubric_scores jsonb DEFAULT '{}';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS graded_by uuid REFERENCES profiles(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create file_uploads table for file management
CREATE TABLE IF NOT EXISTS file_uploads (
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_file_uploads_entity ON file_uploads(entity_type, entity_id);

-- Update RLS policies to fix permission issues
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Create better admin policies
CREATE POLICY "profiles_admin_access"
  ON profiles FOR ALL
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

-- Update courses policies
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
CREATE POLICY "courses_admin_instructor_access"
  ON courses FOR ALL
  TO authenticated
  USING (
    instructor_id = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fix submissions policies for proper instructor access
DROP POLICY IF EXISTS "Instructors can view submissions for their assignments" ON submissions;
DROP POLICY IF EXISTS "Instructors can grade submissions for their assignments" ON submissions;

CREATE POLICY "submissions_student_instructor_access"
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

CREATE POLICY "submissions_instructor_grade"
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
  );

-- Add file_uploads RLS policies
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_uploads_access"
  ON file_uploads FOR ALL
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add missing trigger for submissions
CREATE TRIGGER IF NOT EXISTS update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update the user creation function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, department, student_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'),
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'student_id'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(new.raw_user_meta_data->>'name', profiles.name),
    email = new.email,
    role = COALESCE((new.raw_user_meta_data->>'role')::user_role, profiles.role),
    department = COALESCE(new.raw_user_meta_data->>'department', profiles.department),
    student_id = COALESCE(new.raw_user_meta_data->>'student_id', profiles.student_id),
    updated_at = now();
  
  RETURN new;
END;
$$;

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- Add realtime to new table
DO $$
BEGIN
  -- Only add if the publication exists and table isn't already added
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER publication supabase_realtime ADD TABLE file_uploads;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
