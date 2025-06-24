
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentData {
  id: string;
  nis: string;
  full_name: string;
  gender: string;
  birth_place?: string;
  birth_date?: string;
  religion?: string;
  address?: string;
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_address?: string;
  photo_url?: string;
  user_id?: string;
  status: string;
}

export const useStudentData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const linkStudentToUser = async (studentId: string, userId: string) => {
    try {
      console.log(`Attempting to link student ${studentId} to user ${userId}`);
      const { error: linkError } = await supabase
        .from('students')
        .update({ user_id: userId })
        .eq('id', studentId);

      if (linkError) {
        console.error('Error linking student to user:', linkError);
        return false;
      }
      console.log(`Successfully linked student ${studentId} to user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error in linkStudentToUser:', error);
      return false;
    }
  };

  const fetchStudentData = async (showToast = false) => {
    if (!user?.id) {
      console.log('No user ID available');
      setLoading(false);
      setError('User not authenticated');
      return null;
    }

    console.log('=== COMPREHENSIVE STUDENT DATA DEBUGGING ===');
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);
    
    try {
      setLoading(true);
      setError(null);

      // Step 1: Check if students table exists and has data
      console.log('Step 1: Checking students table...');
      const { data: allStudents, error: studentsError, count } = await supabase
        .from('students')
        .select('*', { count: 'exact' });

      if (studentsError) {
        console.error('Error accessing students table:', studentsError);
        setError(`Database error: ${studentsError.message}`);
        setLoading(false);
        return null;
      }

      console.log(`Found ${count} total students in database`);
      console.log('Sample students:', allStudents?.slice(0, 3));

      if (!allStudents || allStudents.length === 0) {
        console.error('No students found in database');
        setError('No student data exists in database');
        setLoading(false);
        return null;
      }

      // Step 2: Direct lookup by user_id
      console.log('Step 2: Looking up by user_id...');
      const { data: studentByUserId, error: userIdError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userIdError && userIdError.code !== 'PGRST116') {
        console.error('Error in user_id lookup:', userIdError);
      }

      if (studentByUserId) {
        console.log('✓ Found student by user_id:', studentByUserId);
        setStudentData(studentByUserId);
        setLoading(false);
        return studentByUserId;
      }

      // Step 3: Check profiles table
      console.log('Step 3: Checking profiles table...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
      } else {
        console.log('Profile data:', profileData);
      }

      // Step 4: Search by NIS if available in profile
      if (profileData?.nis) {
        console.log('Step 4: Searching by NIS from profile:', profileData.nis);
        const { data: studentByNis, error: nisError } = await supabase
          .from('students')
          .select('*')
          .eq('nis', profileData.nis)
          .maybeSingle();

        if (nisError) {
          console.error('Error in NIS lookup:', nisError);
        }

        if (studentByNis) {
          console.log('✓ Found student by NIS:', studentByNis);
          
          // Auto-link if not already linked
          if (!studentByNis.user_id) {
            const linked = await linkStudentToUser(studentByNis.id, user.id);
            if (linked) {
              const updatedStudent = { ...studentByNis, user_id: user.id };
              setStudentData(updatedStudent);
              if (showToast) {
                toast({
                  title: "Berhasil",
                  description: "Data siswa berhasil dihubungkan dengan akun Anda berdasarkan NIS"
                });
              }
              setLoading(false);
              return updatedStudent;
            }
          } else {
            setStudentData(studentByNis);
            setLoading(false);
            return studentByNis;
          }
        }
      }

      // Step 5: Search by name similarity if available in profile
      if (profileData?.full_name) {
        console.log('Step 5: Searching by name similarity:', profileData.full_name);
        const { data: studentsByName, error: nameError } = await supabase
          .from('students')
          .select('*')
          .ilike('full_name', `%${profileData.full_name.trim()}%`)
          .is('user_id', null);

        if (nameError) {
          console.error('Error in name lookup:', nameError);
        }

        if (studentsByName && studentsByName.length > 0) {
          console.log('✓ Found students by name:', studentsByName);
          
          // Take the best match
          const bestMatch = studentsByName.find(s => 
            s.full_name.toLowerCase() === profileData.full_name.toLowerCase()
          ) || studentsByName[0];
          
          const linked = await linkStudentToUser(bestMatch.id, user.id);
          if (linked) {
            const updatedStudent = { ...bestMatch, user_id: user.id };
            setStudentData(updatedStudent);
            if (showToast) {
              toast({
                title: "Berhasil",
                description: "Data siswa berhasil dihubungkan dengan akun Anda berdasarkan nama"
              });
            }
            setLoading(false);
            return updatedStudent;
          }
        }
      }

      // Step 6: Try email pattern matching
      if (user.email) {
        console.log('Step 6: Email pattern matching...');
        const emailPrefix = user.email.split('@')[0].toLowerCase();
        console.log('Email prefix:', emailPrefix);
        
        const unlinkedStudents = allStudents.filter(s => !s.user_id);
        console.log(`Checking ${unlinkedStudents.length} unlinked students`);
        
        const matchingStudent = unlinkedStudents.find(student => {
          const studentName = student.full_name.toLowerCase();
          const studentNis = student.nis.toLowerCase();
          
          // Check if email contains student info or vice versa
          return studentName.includes(emailPrefix) || 
                 emailPrefix.includes(studentName.split(' ')[0]) ||
                 emailPrefix.includes(studentNis) ||
                 studentNis.includes(emailPrefix);
        });
        
        if (matchingStudent) {
          console.log('✓ Found student by email pattern:', matchingStudent);
          const linked = await linkStudentToUser(matchingStudent.id, user.id);
          if (linked) {
            const updatedStudent = { ...matchingStudent, user_id: user.id };
            setStudentData(updatedStudent);
            if (showToast) {
              toast({
                title: "Berhasil",
                description: "Data siswa berhasil dihubungkan dengan akun Anda berdasarkan email"
              });
            }
            setLoading(false);
            return updatedStudent;
          }
        }
      }

      // Final step: No matches found
      console.log('✗ No student data found with any method');
      console.log('Debug info for admin:');
      console.log('- User ID:', user.id);
      console.log('- User Email:', user.email);
      console.log('- Profile NIS:', profileData?.nis);
      console.log('- Profile Name:', profileData?.full_name);
      console.log('- Total students:', count);
      console.log('- Unlinked students:', allStudents.filter(s => !s.user_id).length);
      
      setError(`Student data not found. Debug: Total students=${count}, User=${user.email}, Profile NIS=${profileData?.nis || 'none'}`);
      setStudentData(null);
      setLoading(false);
      return null;

    } catch (error) {
      console.error('Critical error in fetchStudentData:', error);
      setError(error instanceof Error ? error.message : 'Critical database error');
      setStudentData(null);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchStudentData();
    }
  }, [user?.id]);

  return {
    studentData,
    loading,
    error,
    refetch: () => fetchStudentData(true)
  };
};
