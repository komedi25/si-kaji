
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
      console.log(`🔗 Linking student ${studentId} to user ${userId}`);
      const { error: linkError } = await supabase
        .from('students')
        .update({ user_id: userId })
        .eq('id', studentId);

      if (linkError) {
        console.error('❌ Error linking student to user:', linkError);
        return false;
      }
      console.log('✅ Successfully linked student to user');
      return true;
    } catch (error) {
      console.error('❌ Critical error in linkStudentToUser:', error);
      return false;
    }
  };

  const fetchStudentData = async (showToast = false) => {
    if (!user?.id) {
      console.log('❌ No user ID available');
      setLoading(false);
      setError('User not authenticated');
      return null;
    }

    console.log('🔍 === STUDENT DATA SEARCH START ===');
    console.log('👤 User Info:', { id: user.id, email: user.email });
    
    try {
      setLoading(true);
      setError(null);

      // Step 1: Test database connectivity and count students
      console.log('📊 Step 1: Testing database connectivity...');
      const { data: allStudents, error: studentsError, count } = await supabase
        .from('students')
        .select('id, nis, full_name, user_id', { count: 'exact' })
        .limit(10);

      if (studentsError) {
        console.error('❌ Database connectivity error:', studentsError);
        setError(`Database access failed: ${studentsError.message}`);
        setLoading(false);
        return null;
      }

      console.log(`📈 Found ${count} total students in database`);
      if (!allStudents || allStudents.length === 0) {
        console.error('❌ No students found in database');
        setError('No student data exists in the system');
        setLoading(false);
        return null;
      }

      // Step 2: Direct lookup by user_id
      console.log('🔍 Step 2: Looking up by user_id...');
      const { data: studentByUserId, error: userIdError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userIdError && userIdError.code !== 'PGRST116') {
        console.error('❌ Error in user_id lookup:', userIdError);
      }

      if (studentByUserId) {
        console.log('✅ Found student by user_id:', { id: studentByUserId.id, name: studentByUserId.full_name });
        setStudentData(studentByUserId);
        setLoading(false);
        return studentByUserId;
      }

      // Step 3: Get profile data for enhanced matching
      console.log('🔍 Step 3: Fetching profile data...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Profile error:', profileError);
      } else {
        console.log('📋 Profile data:', profileData);
      }

      // Step 4: Enhanced NIS matching
      if (profileData?.nis) {
        console.log(`🔍 Step 4: Searching by NIS: ${profileData.nis}`);
        const { data: studentByNis, error: nisError } = await supabase
          .from('students')
          .select('*')
          .eq('nis', profileData.nis.trim())
          .is('user_id', null)
          .maybeSingle();

        if (!nisError && studentByNis) {
          console.log('✅ Found unlinked student by NIS:', { id: studentByNis.id, name: studentByNis.full_name });
          
          const linked = await linkStudentToUser(studentByNis.id, user.id);
          if (linked) {
            const updatedStudent = { ...studentByNis, user_id: user.id };
            setStudentData(updatedStudent);
            if (showToast) {
              toast({
                title: "Berhasil Terhubung",
                description: "Data siswa berhasil dihubungkan berdasarkan NIS"
              });
            }
            setLoading(false);
            return updatedStudent;
          }
        }
      }

      // Step 5: Enhanced name matching
      if (profileData?.full_name) {
        console.log(`🔍 Step 5: Searching by name: ${profileData.full_name}`);
        
        // Try exact match first
        const { data: exactNameMatch } = await supabase
          .from('students')
          .select('*')
          .ilike('full_name', profileData.full_name.trim())
          .is('user_id', null)
          .maybeSingle();

        if (exactNameMatch) {
          console.log('✅ Found exact name match:', { id: exactNameMatch.id, name: exactNameMatch.full_name });
          
          const linked = await linkStudentToUser(exactNameMatch.id, user.id);
          if (linked) {
            const updatedStudent = { ...exactNameMatch, user_id: user.id };
            setStudentData(updatedStudent);
            if (showToast) {
              toast({
                title: "Berhasil Terhubung",
                description: "Data siswa berhasil dihubungkan berdasarkan nama"
              });
            }
            setLoading(false);
            return updatedStudent;
          }
        }

        // Try partial name match
        const nameParts = profileData.full_name.trim().split(' ');
        if (nameParts.length >= 2) {
          const { data: partialNameMatches } = await supabase
            .from('students')
            .select('*')
            .or(`full_name.ilike.%${nameParts[0]}%,full_name.ilike.%${nameParts[nameParts.length - 1]}%`)
            .is('user_id', null)
            .limit(5);

          if (partialNameMatches && partialNameMatches.length > 0) {
            console.log('🔍 Found partial name matches:', partialNameMatches.length);
            
            // Find best match based on similarity
            const bestMatch = partialNameMatches.find(student => {
              const studentNameLower = student.full_name.toLowerCase();
              const profileNameLower = profileData.full_name.toLowerCase();
              return studentNameLower.includes(profileNameLower) || 
                     profileNameLower.includes(studentNameLower);
            });

            if (bestMatch) {
              console.log('✅ Found best name match:', { id: bestMatch.id, name: bestMatch.full_name });
              
              const linked = await linkStudentToUser(bestMatch.id, user.id);
              if (linked) {
                const updatedStudent = { ...bestMatch, user_id: user.id };
                setStudentData(updatedStudent);
                if (showToast) {
                  toast({
                    title: "Berhasil Terhubung",
                    description: "Data siswa berhasil dihubungkan berdasarkan kesamaan nama"
                  });
                }
                setLoading(false);
                return updatedStudent;
              }
            }
          }
        }
      }

      // Step 6: Email pattern matching (enhanced)
      if (user.email) {
        console.log('🔍 Step 6: Email pattern matching...');
        const emailPrefix = user.email.split('@')[0].toLowerCase();
        
        // Try to match with NIS in email
        const { data: emailNisMatch } = await supabase
          .from('students')
          .select('*')
          .ilike('nis', `%${emailPrefix}%`)
          .is('user_id', null)
          .maybeSingle();

        if (emailNisMatch) {
          console.log('✅ Found student by email-NIS pattern:', { id: emailNisMatch.id, nis: emailNisMatch.nis });
          
          const linked = await linkStudentToUser(emailNisMatch.id, user.id);
          if (linked) {
            const updatedStudent = { ...emailNisMatch, user_id: user.id };
            setStudentData(updatedStudent);
            if (showToast) {
              toast({
                title: "Berhasil Terhubung",
                description: "Data siswa berhasil dihubungkan berdasarkan pola email"
              });
            }
            setLoading(false);
            return updatedStudent;
          }
        }
      }

      // Final: No matches found - provide detailed debug info
      console.log('❌ === STUDENT DATA SEARCH FAILED ===');
      
      const unlinkedCount = allStudents.filter(s => !s.user_id).length;
      const linkedCount = allStudents.filter(s => s.user_id).length;
      
      console.log('📊 Database Summary:');
      console.log(`   - Total students: ${count}`);
      console.log(`   - Linked students: ${linkedCount}`);
      console.log(`   - Unlinked students: ${unlinkedCount}`);
      console.log('👤 User Details:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Profile NIS: ${profileData?.nis || 'none'}`);
      console.log(`   - Profile Name: ${profileData?.full_name || 'none'}`);
      
      setError(`Student data not found. Debug info: Total=${count}, Unlinked=${unlinkedCount}, User=${user.email}`);
      setStudentData(null);
      setLoading(false);
      return null;

    } catch (error) {
      console.error('💥 Critical error in fetchStudentData:', error);
      setError(error instanceof Error ? error.message : 'Critical system error');
      setStudentData(null);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    if (user?.id) {
      console.log('🚀 Starting student data fetch for user:', user.id);
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
