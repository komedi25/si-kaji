
-- Fix RLS policies for student_self_attendances table
-- First, drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Students can view their own attendance" ON student_self_attendances;
DROP POLICY IF EXISTS "Students can insert their own attendance" ON student_self_attendances;
DROP POLICY IF EXISTS "Students can update their own attendance" ON student_self_attendances;
DROP POLICY IF EXISTS "Teachers and admins can view all attendance" ON student_self_attendances;

-- Create new, more robust RLS policies
-- Policy for students to view their own attendance
CREATE POLICY "Students can view their own attendance" ON student_self_attendances
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Policy for students to insert their own attendance
CREATE POLICY "Students can insert their own attendance" ON student_self_attendances
  FOR INSERT WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Policy for students to update their own attendance
CREATE POLICY "Students can update their own attendance" ON student_self_attendances
  FOR UPDATE USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  ) WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Policy for teachers and admins to view all attendance
CREATE POLICY "Teachers and admins can view all attendance" ON student_self_attendances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'wali_kelas', 'guru_bk', 'tppk', 'arps', 'waka_kesiswaan') 
      AND is_active = true
    )
  );

-- Policy for teachers and admins to manage attendance
CREATE POLICY "Teachers and admins can manage attendance" ON student_self_attendances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'wali_kelas', 'guru_bk', 'tppk', 'arps', 'waka_kesiswaan') 
      AND is_active = true
    )
  );

-- Also ensure the students table has proper RLS for linking
-- Check if students table RLS policies exist and are correct
DROP POLICY IF EXISTS "Students can view their own data" ON students;
DROP POLICY IF EXISTS "Teachers and admins can view all students" ON students;

CREATE POLICY "Students can view their own data" ON students
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers and admins can view all students" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'wali_kelas', 'guru_bk', 'tppk', 'arps', 'waka_kesiswaan') 
      AND is_active = true
    )
  );

-- Make sure RLS is enabled on both tables
ALTER TABLE student_self_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
