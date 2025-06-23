
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, UserCheck, UserX, Settings, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  nip: string | null;
  nis: string | null;
  phone: string | null;
  user_roles: Array<{
    role: string;
    is_active: boolean;
  }>;
}

type AppRole = 'admin' | 'kepala_sekolah' | 'tppk' | 'arps' | 'p4gn' | 'koordinator_ekstrakurikuler' | 'wali_kelas' | 'guru_bk' | 'waka_kesiswaan' | 'pelatih_ekstrakurikuler' | 'siswa' | 'orang_tua' | 'penanggung_jawab_sarpras' | 'osis';

export const BulkUserManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkRole, setBulkRole] = useState<AppRole | ''>('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // First get profiles with their user roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          nip,
          nis,
          phone
        `)
        .order('full_name');
      
      if (profilesError) throw profilesError;

      // Get user roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, is_active');
      
      if (rolesError) throw rolesError;

      // Get emails from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Combine the data
      return profilesData?.map(profile => {
        const userRoles = rolesData?.filter(role => role.user_id === profile.id) || [];
        const authUser = authUsers.users.find(user => user.id === profile.id);
        
        return {
          ...profile,
          email: authUser?.email || 'N/A',
          user_roles: userRoles.map(role => ({
            role: role.role,
            is_active: role.is_active
          }))
        };
      }) as UserWithRoles[];
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ userIds, action, role }: { userIds: string[]; action: string; role?: AppRole }) => {
      if (action === 'activate_role' && role) {
        // Activate specific role for selected users
        const updates = userIds.map(userId => ({
          user_id: userId,
          role: role as AppRole,
          is_active: true
        }));

        const { error } = await supabase
          .from('user_roles')
          .upsert(updates, { onConflict: 'user_id,role' });
        
        if (error) throw error;

      } else if (action === 'deactivate_role' && role) {
        // Deactivate specific role for selected users
        const { error } = await supabase
          .from('user_roles')
          .update({ is_active: false })
          .in('user_id', userIds)
          .eq('role', role);
        
        if (error) throw error;

      } else if (action === 'deactivate_all') {
        // Deactivate all roles for selected users
        const { error } = await supabase
          .from('user_roles')
          .update({ is_active: false })
          .in('user_id', userIds);
        
        if (error) throw error;

      } else if (action === 'delete_users') {
        // Delete selected users (this will cascade to user_roles)
        for (const userId of userIds) {
          const { error } = await supabase.auth.admin.deleteUser(userId);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      setSelectedUsers([]);
      setBulkAction('');
      setBulkRole('');
      toast({ title: 'Aksi bulk berhasil dilakukan' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users?.map(user => user.id) || []);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkAction = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Tidak Ada Pengguna Dipilih",
        description: "Pilih setidaknya satu pengguna untuk melakukan aksi bulk",
        variant: "destructive"
      });
      return;
    }

    if (!bulkAction) {
      toast({
        title: "Pilih Aksi",
        description: "Pilih aksi yang akan dilakukan",
        variant: "destructive"
      });
      return;
    }

    if ((bulkAction === 'activate_role' || bulkAction === 'deactivate_role') && !bulkRole) {
      toast({
        title: "Pilih Role",
        description: "Pilih role untuk aksi yang akan dilakukan",
        variant: "destructive"
      });
      return;
    }

    const actionLabels = {
      'activate_role': `mengaktifkan role ${bulkRole}`,
      'deactivate_role': `menonaktifkan role ${bulkRole}`,
      'deactivate_all': 'menonaktifkan semua role',
      'delete_users': 'menghapus pengguna'
    };

    if (window.confirm(`Apakah Anda yakin ingin ${actionLabels[bulkAction as keyof typeof actionLabels]} untuk ${selectedUsers.length} pengguna?`)) {
      bulkUpdateMutation.mutate({
        userIds: selectedUsers,
        action: bulkAction,
        role: bulkRole as AppRole || undefined
      });
    }
  };

  const getRolesBadges = (userRoles: Array<{ role: string; is_active: boolean }>) => {
    return userRoles
      .filter(ur => ur.is_active)
      .map(ur => (
        <Badge key={ur.role} variant="secondary" className="text-xs">
          {ur.role}
        </Badge>
      ));
  };

  const availableRoles: AppRole[] = [
    'admin', 'kepala_sekolah', 'tppk', 'arps', 'p4gn', 
    'koordinator_ekstrakurikuler', 'wali_kelas', 'guru_bk', 
    'waka_kesiswaan', 'pelatih_ekstrakurikuler', 'siswa', 
    'orang_tua', 'penanggung_jawab_sarpras', 'osis'
  ];

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Manajemen Pengguna Bulk
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Bulk Actions Controls */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedUsers.length === users?.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Pilih Semua ({selectedUsers.length}/{users?.length || 0})
              </label>
            </div>

            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pilih aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activate_role">Aktifkan Role</SelectItem>
                <SelectItem value="deactivate_role">Nonaktifkan Role</SelectItem>
                <SelectItem value="deactivate_all">Nonaktifkan Semua Role</SelectItem>
                <SelectItem value="delete_users">Hapus Pengguna</SelectItem>
              </SelectContent>
            </Select>

            {(bulkAction === 'activate_role' || bulkAction === 'deactivate_role') && (
              <Select value={bulkRole} onValueChange={(value: AppRole) => setBulkRole(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button 
              onClick={handleBulkAction}
              disabled={selectedUsers.length === 0 || !bulkAction || bulkUpdateMutation.isPending}
              variant={bulkAction === 'delete_users' ? 'destructive' : 'default'}
            >
              {bulkUpdateMutation.isPending ? (
                'Memproses...'
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Jalankan Aksi
                </>
              )}
            </Button>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm border-b">
              <div className="col-span-1">Pilih</div>
              <div className="col-span-3">Nama/Email</div>
              <div className="col-span-2">NIP/NIS</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-4">Roles</div>
            </div>

            <div className="divide-y">
              {users?.map((user) => (
                <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50">
                  <div className="col-span-1">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  
                  <div className="col-span-2 text-sm">
                    {user.nip && <div>NIP: {user.nip}</div>}
                    {user.nis && <div>NIS: {user.nis}</div>}
                    {!user.nip && !user.nis && '-'}
                  </div>
                  
                  <div className="col-span-2 text-sm">
                    {user.phone || '-'}
                  </div>
                  
                  <div className="col-span-4">
                    <div className="flex flex-wrap gap-1">
                      {getRolesBadges(user.user_roles)}
                      {user.user_roles.filter(ur => ur.is_active).length === 0 && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          Tidak ada role aktif
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {users?.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Tidak ada pengguna ditemukan</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
