
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
      const { error: linkError } = await supabase
        .from('students')
        .update({ user_id: userId })
        .eq('id', studentId);

      if (linkError) {
        console.error('Error linking student to user:', linkError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in linkStudentToUser:', error);
      return false;
    }
  };

  const fetchStudentData = async (showToast = false) => {
    if (!user?.id) {
      setLoading(false);
      setError('User not authenticated');
      return null;
    }

    console.log('=== DEBUGGING STUDENT DATA FETCH ===');
    console.log('User ID:', user.id);
    console.log('User Email:', user.email);

    try {
      setLoading(true);
      setError(null);

      // Method 1: Direct lookup by user_id
      console.log('Method 1: Looking up by user_id...');
      let { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentError && studentError.code !== 'PGRST116') {
        throw studentError;
      }

      if (studentData) {
        console.log('✓ Found student by user_id:', studentData);
        setStudentData(studentData);
        setLoading(false);
        return studentData;
      }

      // Method 2: Get profile data and search by NIS/Name
      console.log('Method 2: Looking up profile data...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      console.log('Profile data:', profileData);

      // Method 3: Search by NIS from profile
      if (profileData?.nis) {
        console.log('Method 3: Searching by NIS:', profileData.nis);
        const { data: studentByNis, error: nisError } = await supabase
          .from('students')
          .select('*')
          .eq('nis', profileData.nis)
          .maybeSingle();

        if (!nisError && studentByNis) {
          console.log('✓ Found student by NIS:', studentByNis);
          
          // Auto-link if not already linked
          if (!studentByNis.user_id) {
            const linked = await linkStudentToUser(studentByNis.id, user.id);
            if (linked) {
              studentData = { ...studentByNis, user_id: user.id };
              if (showToast) {
                toast({
                  title: "Berhasil",
                  description: "Data siswa berhasil dihubungkan dengan akun Anda"
                });
              }
            }
          } else {
            studentData = studentByNis;
          }
          
          setStudentData(studentData);
          setLoading(false);
          return studentData;
        }
      }

      // Method 4: Search by name similarity
      if (profileData?.full_name) {
        console.log('Method 4: Searching by name:', profileData.full_name);
        const { data: studentsByName, error: nameError } = await supabase
          .from('students')
          .select('*')
          .ilike('full_name', `%${profileData.full_name.trim()}%`)
          .is('user_id', null);

        if (!nameError && studentsByName && studentsByName.length > 0) {
          console.log('✓ Found students by name:', studentsByName);
          
          // Take the first match (could be improved with better matching logic)
          const studentByName = studentsByName[0];
          const linked = await linkStudentToUser(studentByName.id, user.id);
          
          if (linked) {
            studentData = { ...studentByName, user_id: user.id };
            if (showToast) {
              toast({
                title: "Berhasil",
                description: "Data siswa berhasil dihubungkan dengan akun Anda berdasarkan nama"
              });
            }
            setStudentData(studentData);
            setLoading(false);
            return studentData;
          }
        }
      }

      // Method 5: Check if there are any students without user_id that match email pattern
      if (user.email) {
        console.log('Method 5: Checking for students without user_id...');
        const { data: allUnlinkedStudents } = await supabase
          .from('students')
          .select('*')
          .is('user_id', null);

        console.log('Unlinked students:', allUnlinkedStudents?.length || 0);
        
        // If only one unlinked student exists, suggest linking
        if (allUnlinkedStudents && allUnlinkedStudents.length === 1) {
          console.log('Only one unlinked student found, consider auto-linking');
        }
      }

      console.log('✗ No student data found with any method');
      setError('Student data not found');
      setStudentData(null);
      setLoading(false);
      return null;

    } catch (error) {
      console.error('Error in fetchStudentData:', error);
      setError(error instanceof Error ? error.message : 'Gagal memuat data siswa');
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
