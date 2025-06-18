
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/auth';
import { AllUserData, ProfileData, StudentData, UserRoleData, AuthUserData } from '@/types/user';

export const useUserManagement = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<AllUserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles (staff/teachers) with proper typing
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .not('nip', 'is', null)
        .returns<ProfileData[]>();

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Fetch all students with proper typing
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
        .order('full_name')
        .returns<StudentData[]>();

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
      }

      // Fetch all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
      }

      // Get auth users for email data
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error('Error fetching auth users:', authError);
      }

      // Cast to proper types to avoid TypeScript errors
      const typedUserRoles = (userRoles || []) as UserRoleData[];
      const typedAuthUsers = (authUsers?.users || []) as AuthUserData[];

      // Combine all data
      const combinedUsers: AllUserData[] = [];

      // Add staff/teachers
      if (profiles && Array.isArray(profiles)) {
        profiles.forEach((profile: ProfileData) => {
          const roles = typedUserRoles
            .filter(ur => ur.user_id === profile.id)
            .map(ur => ur.role as AppRole);

          const authUser = typedAuthUsers.find(au => au.id === profile.id);

          combinedUsers.push({
            id: profile.id,
            full_name: profile.full_name,
            email: authUser?.email || null,
            nip: profile.nip,
            nis: null,
            phone: profile.phone,
            user_type: 'staff',
            roles,
            has_user_account: true,
            created_at: profile.created_at || new Date().toISOString()
          });
        });
      }

      // Add students
      if (students && Array.isArray(students)) {
        students.forEach((student: StudentData) => {
          const enrollment = student.student_enrollments?.[0];
          const roles = typedUserRoles
            .filter(ur => ur.user_id === student.user_id)
            .map(ur => ur.role as AppRole);

          const authUser = typedAuthUsers.find(au => au.id === student.user_id);

          combinedUsers.push({
            id: student.id,
            full_name: student.full_name,
            email: authUser?.email || null,
            nip: null,
            nis: student.nis,
            phone: student.phone,
            user_type: 'student',
            roles,
            current_class: enrollment?.classes ? 
              `${enrollment.classes.grade} ${enrollment.classes.name}` : '-',
            has_user_account: !!student.user_id,
            created_at: student.created_at
          });
        });
      }

      // Sort by name
      combinedUsers.sort((a, b) => a.full_name.localeCompare(b.full_name));
      
      setAllUsers(combinedUsers);
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
        .eq('id', studentData.id);

      if (updateError) throw updateError;

      // Add siswa role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: 'siswa',
          assigned_by: user.id
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
        const { data: studentData } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', userToDelete.id)
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
          .eq('student_id', userToDelete.id);

        // Delete student record
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', userToDelete.id);

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
    if (hasRole('admin')) {
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
