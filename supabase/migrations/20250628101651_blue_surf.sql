/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - Admin policies on profiles table were causing infinite recursion
    - Policies were checking admin status by querying profiles table again
    - This created an infinite loop

  2. Solution
    - Use auth.jwt() to check user metadata instead of querying profiles
    - Replace uid() with auth.uid() (correct Supabase function)
    - Simplify policies to avoid recursion
*/

-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new admin policies using auth.jwt() to avoid recursion
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    OR 
    auth.uid() = id
  )
  WITH CHECK (
    (auth.jwt() ->> 'role')::text = 'admin'
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    OR 
    auth.uid() = id
  );

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
    OR 
    auth.uid() = id
  );

-- Update other table policies that might reference profiles for admin checks
-- Fix courses policies to avoid recursion
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
CREATE POLICY "Admins can manage all courses"
  ON courses
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role')::text = 'admin'
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Fix assignments policies
DROP POLICY IF EXISTS "Instructors can manage assignments for their courses" ON assignments;
CREATE POLICY "Instructors can manage assignments for their courses"
  ON assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = assignments.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- Fix submissions policies
DROP POLICY IF EXISTS "Instructors can grade submissions for their assignments" ON submissions;
CREATE POLICY "Instructors can grade submissions for their assignments"
  ON submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = submissions.assignment_id 
      AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can view submissions for their assignments" ON submissions;
CREATE POLICY "Instructors can view submissions for their assignments"
  ON submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN courses c ON a.course_id = c.id
      WHERE a.id = submissions.assignment_id 
      AND c.instructor_id = auth.uid()
    )
    OR student_id = auth.uid()
  );

-- Fix attendance records policies
DROP POLICY IF EXISTS "Instructors can manage attendance for their courses" ON attendance_records;
CREATE POLICY "Instructors can manage attendance for their courses"
  ON attendance_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = attendance_records.course_id 
      AND courses.instructor_id = auth.uid()
    )
  );

-- Fix enrollments policies
DROP POLICY IF EXISTS "Instructors can view their course enrollments" ON enrollments;
CREATE POLICY "Instructors can view their course enrollments"
  ON enrollments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = enrollments.course_id 
      AND courses.instructor_id = auth.uid()
    )
    OR student_id = auth.uid()
  );