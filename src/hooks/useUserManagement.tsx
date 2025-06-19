
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/auth';
import { AllUserData, ProfileData, StudentData, UserRoleData } from '@/types/user';

export const useUserManagement = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<AllUserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching all users data...');
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      console.log('Profiles fetched:', profiles?.length || 0);

      // Fetch all students with class information
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          student_enrollments!inner (
            classes (
              name,
              grade
            )
          )
        `)
        .order('full_name');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
      }

      console.log('Students fetched:', students?.length || 0);

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      console.log('User roles fetched:', userRoles?.length || 0);

      // Combine all data
      const combinedUsers: AllUserData[] = [];
      const userIdSet = new Set<string>();

      // Add all profiles (both staff and students who have profiles)
      if (profiles && Array.isArray(profiles)) {
        profiles.forEach((profile: ProfileData) => {
          const roles = (userRoles || [])
            .filter(ur => ur.user_id === profile.id)
            .map(ur => ur.role as AppRole);

          combinedUsers.push({
            id: profile.id,
            full_name: profile.full_name,
            email: null,
            nip: profile.nip,
            nis: profile.nis,
            phone: profile.phone,
            user_type: profile.nip ? 'staff' : 'student',
            roles,
            has_user_account: true,
            created_at: profile.created_at || new Date().toISOString()
          });

          userIdSet.add(profile.id);
        });
      }

      // Add students who don't have profiles yet
      if (students && Array.isArray(students)) {
        students.forEach((student: StudentData) => {
          // Skip if this student already has a profile
          if (student.user_id && userIdSet.has(student.user_id)) {
            // Update existing profile entry with student data
            const existingIndex = combinedUsers.findIndex(u => u.id === student.user_id);
            if (existingIndex !== -1) {
              const enrollment = student.student_enrollments?.[0];
              combinedUsers[existingIndex].current_class = enrollment?.classes ? 
                `${enrollment.classes.grade} ${enrollment.classes.name}` : '-';
              combinedUsers[existingIndex].student_id = student.id;
              combinedUsers[existingIndex].student_status = student.status;
              combinedUsers[existingIndex].nis = student.nis;
            }
            return;
          }

          // Add students without profiles
          const enrollment = student.student_enrollments?.[0];
          const roles: AppRole[] = [];

          // If student has user_id, check for roles
          if (student.user_id) {
            const studentRoles = (userRoles || [])
              .filter(ur => ur.user_id === student.user_id)
              .map(ur => ur.role as AppRole);
            roles.push(...studentRoles);
          }

          combinedUsers.push({
            id: student.user_id || student.id,
            full_name: student.full_name,
            email: null,
            nip: null,
            nis: student.nis,
            phone: student.phone,
            user_type: 'student',
            roles,
            current_class: enrollment?.classes ? 
              `${enrollment.classes.grade} ${enrollment.classes.name}` : '-',
            has_user_account: !!student.user_id,
            created_at: student.created_at,
            student_id: student.id,
            student_status: student.status
          });
        });
      }

      console.log('Combined users before filtering:', combinedUsers.length);

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

      // Update student with user_id
      const { error: updateError } = await supabase
        .from('students')
        .update({ user_id: profile.id })
        .eq('id', studentData.student_id || studentData.id);

      if (updateError) throw updateError;

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
        // For students, delete from students table
        const studentId = userToDelete.student_id || userToDelete.id;
        
        const { data: studentData } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', studentId)
          .single();

        if (studentData?.user_id) {
          // Delete user roles
          await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', studentData.user_id);

          // Delete profile
          await supabase
            .from('profiles')
            .delete()
            .eq('id', studentData.user_id);
        }

        // Delete student enrollments
        await supabase
          .from('student_enrollments')
          .delete()
          .eq('student_id', studentId);

        // Delete student record
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', studentId);

        if (error) throw error;
      } else {
        // For staff, delete from profiles table
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
