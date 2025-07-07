import { createClient } from '@supabase/supabase-js';

// Simple data types to avoid recursion
export interface ExtracurricularData {
  id: string;
  name: string;
  description?: string;
  schedule_day?: string;
  schedule_time?: string;
  location?: string;
  max_participants?: number;
  current_participants: number;
  enrollments: EnrollmentData[];
}

export interface EnrollmentData {
  id: string;
  student_name: string;
  student_nis: string;
  student_class?: string;
  enrollment_date: string;
  status: string;
}

export interface StudentData {
  id: string;
  full_name: string;
  nis: string;
  class_name?: string;
}

// Create a simple supabase client to avoid type recursion
const supabaseClient = createClient(
  "https://ofquyellugscpitvpcpj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mcXV5ZWxsdWdzY3BpdHZwY3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDQxMjcsImV4cCI6MjA2NDQyMDEyN30.wLwNrZcYa5WAgKC5_RDXYOq43KfwHqfmxIXJMpeCVHw"
);

export const ExtracurricularService = {
  async fetchExtracurriculars(): Promise<ExtracurricularData[]> {
    try {
      const { data: extracurriculars, error } = await supabaseClient
        .from('extracurriculars')
        .select('id, name, description, schedule_day, schedule_time, location, max_participants')
        .eq('is_active', true);

      if (error) throw error;

      const result: ExtracurricularData[] = [];
      
      for (const extra of extracurriculars || []) {
        const { data: enrollments } = await supabaseClient
          .from('extracurricular_enrollments')
          .select('id, enrollment_date, status, student_id')
          .eq('extracurricular_id', extra.id)
          .eq('status', 'active');

        const processedEnrollments: EnrollmentData[] = [];
        
        for (const enrollment of enrollments || []) {
          const { data: student } = await supabaseClient
            .from('students')
            .select('id, full_name, nis')
            .eq('id', enrollment.student_id)
            .single();

          if (student) {
            processedEnrollments.push({
              id: enrollment.id,
              student_name: student.full_name,
              student_nis: student.nis,
              enrollment_date: enrollment.enrollment_date,
              status: enrollment.status
            });
          }
        }

        result.push({
          ...extra,
          current_participants: processedEnrollments.length,
          enrollments: processedEnrollments
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching extracurriculars:', error);
      throw error;
    }
  },

  async fetchStudents(): Promise<StudentData[]> {
    try {
      const { data: students, error } = await supabaseClient
        .from('students')
        .select('id, full_name, nis')
        .eq('is_active', true);

      if (error) throw error;

      return (students || []).map(student => ({
        id: student.id,
        full_name: student.full_name,
        nis: student.nis
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  async enrollStudent(studentId: string, extracurricularId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('extracurricular_enrollments')
      .insert({
        student_id: studentId,
        extracurricular_id: extracurricularId,
        status: 'active'
      });

    if (error) throw error;
  }
};