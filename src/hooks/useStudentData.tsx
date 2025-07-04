
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StudentProfile {
  id: string;
  full_name: string;
  nis: string;
  class_name?: string;
  major_name?: string;
  phone?: string;
  address?: string;
  photo_url?: string;
  status: string;
}

export const useStudentDetails = (studentId: string | null) => {
  return useQuery({
    queryKey: ['student-details', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_enrollments!inner(
            classes(
              id,
              name,
              majors(name)
            )
          )
        `)
        .eq('id', studentId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        full_name: data.full_name,
        nis: data.nis,
        phone: data.phone,
        address: data.address,
        photo_url: data.photo_url,
        status: data.status,
        class_name: data.student_enrollments[0]?.classes?.name,
        major_name: data.student_enrollments[0]?.classes?.majors?.name
      } as StudentProfile;
    },
    enabled: !!studentId
  });
};

export const useClassStudents = (classId: string | null) => {
  return useQuery({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      if (!classId) return [];
      
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          students(
            id,
            full_name,
            nis,
            status,
            photo_url
          )
        `)
        .eq('class_id', classId)
        .eq('status', 'active');

      if (error) throw error;
      
      return data?.map(enrollment => enrollment.students).filter(Boolean) || [];
    },
    enabled: !!classId
  });
};

export const useHomeRoomStudents = (teacherId: string | null) => {
  return useQuery({
    queryKey: ['homeroom-students', teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          student_enrollments!inner(
            students(
              id,
              full_name,
              nis,
              status,
              photo_url
            )
          )
        `)
        .eq('homeroom_teacher_id', teacherId)
        .eq('student_enrollments.status', 'active');

      if (error) throw error;
      
      return data?.flatMap(cls => 
        cls.student_enrollments.map(enrollment => enrollment.students)
      ).filter(Boolean) || [];
    },
    enabled: !!teacherId
  });
};
