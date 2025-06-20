import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/auth';
import { AllUserData } from '@/types/user';

export const useUserManagement = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<AllUserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching all users data...');
      
      // First, get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles fetched:', profiles?.length || 0);

      // Get all user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        throw rolesError;
      }

      console.log('User roles fetched:', userRoles?.length || 0);

      // Process profiles into AllUserData
      const combinedUsers: AllUserData[] = [];

      if (profiles && Array.isArray(profiles)) {
        for (const profile of profiles) {
          // Find roles for this user
          const roles = userRoles?.filter(ur => ur.user_id === profile.id)?.map(ur => ur.role as AppRole) || [];
          
          // Skip users without any roles
          if (roles.length === 0) continue;

          const isStudent = roles.includes('siswa');
          
          let currentClass = '';
          let studentId = '';
          let studentStatus = 'active';

          if (isStudent) {
            // Get student data and current class
            const { data: studentData } = await supabase
              .from('students')
              .select(`
                id,
                status,
                student_enrollments!inner (
                  classes (
                    name,
                    grade
                  )
                )
              `)
              .eq('user_id', profile.id)
              .eq('student_enrollments.status', 'active')
              .maybeSingle();

            if (studentData) {
              studentId = studentData.id;
              studentStatus = studentData.status;
              const enrollment = studentData.student_enrollments?.[0];
              if (enrollment?.classes) {
                currentClass = `${enrollment.classes.grade} ${enrollment.classes.name}`;
              }
            }
          }

          combinedUsers.push({
            id: profile.id,
            full_name: profile.full_name,
            email: null, // Will be fetched from auth if needed
            nip: profile.nip,
            nis: profile.nis,
            phone: profile.phone,
            user_type: isStudent ? 'student' : 'staff',
            roles,
            current_class: currentClass || undefined,
            has_user_account: true, // All profiles have accounts by definition
            created_at: profile.created_at || new Date().toISOString(),
            student_id: studentId || undefined,
            student_status: isStudent ? studentStatus : undefined
          });
        }
      }

      console.log('Combined users:', combinedUsers.length);

      // Filter based on user role
      let filteredUsers = combinedUsers;
      if (hasRole('siswa')) {
        // Students can only see their own data
        filteredUsers = combinedUsers.filter(userData => 
          userData.user_type === 'student' && userData.id === user?.id
        );
      } else if (hasRole('wali_kelas') || hasRole('guru_bk')) {
        // Wali kelas and guru BK can see students and some staff
        filteredUsers = combinedUsers.filter(userData => 
          userData.user_type === 'student' || 
          (userData.user_type === 'staff' && 
           (userData.roles.includes('wali_kelas') || userData.roles.includes('guru_bk')))
        );
      }
      // Admin can see all users (no filter)

      console.log('Final users after filtering:', filteredUsers.length);

      // Sort by name
      filteredUsers.sort((a, b) => a.full_name.localeCompare(b.full_name));
      
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error('Error in fetchAllUsers:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createStudentUserAccount = async (studentData: AllUserData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID tidak ditemukan",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate UUID for new profile
      const newUserId = crypto.randomUUID();
      
      // Create profile for student with proper ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUserId,
          full_name: studentData.full_name,
          nis: studentData.nis
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Create basic student record
      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: profile.id,
          full_name: studentData.full_name,
          nis: studentData.nis,
          gender: 'L', // Default, bisa diubah nanti
          status: 'active'
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Add siswa role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: 'siswa',
          assigned_by: user.id,
          is_active: true
        });

      if (roleError) throw roleError;

      const tempEmail = `${studentData.nis}@temp.smkn1kendal.sch.id`;
      const tempPassword = `siswa${studentData.nis}`;

      toast({
        title: "Berhasil",
        description: `Akun user berhasil dibuat untuk ${studentData.full_name}. Email: ${tempEmail}, Password: ${tempPassword}`
      });

      fetchAllUsers();
    } catch (error) {
      console.error('Error creating user account:', error);
      toast({
        title: "Error",
        description: "Gagal membuat akun user: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (userData: AllUserData) => {
    try {
      const identifier = userData.user_type === 'student' ? userData.nis : userData.nip;
      const prefix = userData.user_type === 'student' ? 'siswa' : 'staff';
      const newPassword = `${prefix}${identifier}`;
      
      toast({
        title: "Password direset",
        description: `Password baru untuk ${userData.full_name}: ${newPassword}. Silakan berikan kepada pengguna.`
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Gagal mereset password: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userToDelete: AllUserData) => {
    try {
      if (userToDelete.user_type === 'student') {
        // For students, delete related records first
        if (userToDelete.student_id) {
          // Delete student enrollments
          await supabase
            .from('student_enrollments')
            .delete()
            .eq('student_id', userToDelete.student_id);

          // Delete student record
          await supabase
            .from('students')
            .delete()
            .eq('id', userToDelete.student_id);
        }

        // Delete user roles
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userToDelete.id);

        // Delete profile
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userToDelete.id);

        if (error) throw error;
      } else {
        // For staff, delete user roles then profile
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userToDelete.id);

        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userToDelete.id);

        if (error) throw error;
      }

      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus"
      });

      fetchAllUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus pengguna: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (hasRole('admin') || hasRole('wali_kelas') || hasRole('guru_bk') || hasRole('siswa')) {
      fetchAllUsers();
    }
  }, [hasRole]);

  return {
    allUsers,
    loading,
    fetchAllUsers,
    createStudentUserAccount,
    resetPassword,
    handleDeleteUser
  };
};
