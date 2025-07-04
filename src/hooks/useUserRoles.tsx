
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppRole } from '@/types/auth';
import { AllUserData } from '@/types/user';

export const useUserRoles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<AllUserData | null>(null);
  const [newRole, setNewRole] = useState<AppRole | ''>('');
  const [isAddingRole, setIsAddingRole] = useState(false);

  // Updated role options - removed admin_kesiswaan
  const roleOptions: { value: AppRole; label: string }[] = [
    { value: 'admin', label: 'Admin Sistem' },
    { value: 'kepala_sekolah', label: 'Kepala Sekolah' },
    { value: 'waka_kesiswaan', label: 'Waka Kesiswaan' },
    { value: 'tppk', label: 'TPPK' },
    { value: 'arps', label: 'ARPS' },
    { value: 'p4gn', label: 'P4GN' },
    { value: 'koordinator_ekstrakurikuler', label: 'Koordinator Ekstrakurikuler' },
    { value: 'wali_kelas', label: 'Wali Kelas' },
    { value: 'guru_bk', label: 'Guru BK' },
    { value: 'pelatih_ekstrakurikuler', label: 'Pelatih Ekstrakurikuler' },
    { value: 'siswa', label: 'Siswa' },
    { value: 'orang_tua', label: 'Orang Tua' },
    { value: 'penanggung_jawab_sarpras', label: 'PJ Sarpras' },
    { value: 'osis', label: 'OSIS' }
  ];

  const getRoleLabel = (role: AppRole) => {
    const found = roleOptions.find(option => option.value === role);
    return found ? found.label : role;
  };

  const addRoleToUser = async (onSuccess: () => void) => {
    if (!selectedUser || !newRole) return;

    try {
      setIsAddingRole(true);
      
      // Find the actual user_id (for students, we need to get it from the student record)
      let targetUserId = selectedUser.id;
      
      if (selectedUser.user_type === 'student' && !selectedUser.has_user_account) {
        toast({
          title: "Error",
          description: "Siswa belum memiliki akun pengguna. Buat akun terlebih dahulu.",
          variant: "destructive"
        });
        return;
      }

      if (selectedUser.user_type === 'student') {
        // Get the user_id from student record
        const { data: studentData } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', selectedUser.student_id || selectedUser.id)
          .single();
        
        if (studentData?.user_id) {
          targetUserId = studentData.user_id;
        }
      }
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUserId,
          role: newRole as any,
          assigned_by: user?.id,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Role ${getRoleLabel(newRole)} berhasil ditambahkan`
      });

      setNewRole('');
      setSelectedUser(null);
      onSuccess();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan role: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsAddingRole(false);
    }
  };

  const removeRoleFromUser = async (userData: AllUserData, role: AppRole, onSuccess: () => void) => {
    try {
      let targetUserId = userData.id;
      
      if (userData.user_type === 'student') {
        // Get the user_id from student record
        const { data: studentData } = await supabase
          .from('students')
          .select('user_id')
          .eq('id', userData.student_id || userData.id)
          .single();
        
        if (studentData?.user_id) {
          targetUserId = studentData.user_id;
        }
      }

      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', targetUserId)
        .eq('role', role as any);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Role ${getRoleLabel(role)} berhasil dihapus`
      });

      onSuccess();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus role: " + (error as Error).message,
        variant: "destructive"
      });
    }
  };

  return {
    selectedUser,
    setSelectedUser,
    newRole,
    setNewRole,
    isAddingRole,
    roleOptions,
    getRoleLabel,
    addRoleToUser,
    removeRoleFromUser
  };
};
