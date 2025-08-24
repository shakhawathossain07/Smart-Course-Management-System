/*
  # Add admin policies for user management

  1. Security Changes
    - Add policies to allow admins to view all profiles
    - Add policies to allow admins to manage users
    - Ensure real-time subscriptions work properly

  2. Policy Updates
    - Admins can view all profiles
    - Admins can delete users (through auth.users)
    - Real-time policies for live updates
*/

-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
    OR auth.uid() = id
  );

-- Add policy for admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
    OR auth.uid() = id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
    OR auth.uid() = id
  );

-- Add policy for admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin'
    )
  );

-- Enable real-time for all authenticated users on relevant tables
ALTER publication supabase_realtime ADD TABLE profiles;
ALTER publication supabase_realtime ADD TABLE courses;
ALTER publication supabase_realtime ADD TABLE enrollments;
ALTER publication supabase_realtime ADD TABLE notifications;
ALTER publication supabase_realtime ADD TABLE assignments;
ALTER publication supabase_realtime ADD TABLE submissions;
ALTER publication supabase_realtime ADD TABLE attendance_records;

-- Grant real-time permissions
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON courses TO authenticated;
GRANT SELECT ON enrollments TO authenticated;
GRANT SELECT ON notifications TO authenticated;
GRANT SELECT ON assignments TO authenticated;
GRANT SELECT ON submissions TO authenticated;
GRANT SELECT ON attendance_records TO authenticated;