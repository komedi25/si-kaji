
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    nip: '',
    nis: '',
    phone: '',
    address: '',
    role: '' as AppRole | ''
  });

  const roleOptions: { value: AppRole; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'kepala_sekolah', label: 'Kepala Sekolah' },
    { value: 'tppk', label: 'TPPK' },
    { value: 'arps', label: 'ARPS' },
    { value: 'p4gn', label: 'P4GN' },
    { value: 'koordinator_ekstrakurikuler', label: 'Koordinator Ekstrakurikuler' },
    { value: 'wali_kelas', label: 'Wali Kelas' },
    { value: 'guru_bk', label: 'Guru BK' },
    { value: 'waka_kesiswaan', label: 'Waka Kesiswaan' },
    { value: 'pelatih_ekstrakurikuler', label: 'Pelatih Ekstrakurikuler' },
    { value: 'siswa', label: 'Siswa' },
    { value: 'orang_tua', label: 'Orang Tua' },
    { value: 'penanggung_jawab_sarpras', label: 'Penanggung Jawab Sarpras' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.role) {
      toast({
        title: "Error",
        description: "Pilih role untuk pengguna",
        variant: "destructive"
      });
      return;
    }

    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Email dan password harus diisi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating user with signup method...');
      
      // Store current session to restore later
      const { data: currentSession } = await supabase.auth.getSession();
      
      // Create user with regular signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      console.log('User created successfully:', authData.user.id);

      // Restore the original session to prevent auto-login
      if (currentSession.session) {
        await supabase.auth.setSession(currentSession.session);
      }

      // Create profile with the actual user ID
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: formData.full_name,
          nip: formData.role === 'siswa' ? null : formData.nip || null,
          nis: formData.role === 'siswa' ? formData.nis || null : null,
          phone: formData.phone || null,
          address: formData.address || null
        });

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }

      console.log('Profile created successfully');

      // Create user role - this is the fix for automatic role assignment
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: formData.role,
          assigned_by: currentSession.session?.user.id || null,
          is_active: true
        });

      if (roleError) {
        console.error('Role error:', roleError);
        throw roleError;
      }

      console.log('Role assigned successfully');

      // If role is student, create student record
      if (formData.role === 'siswa' && formData.nis) {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: authData.user.id,
            nis: formData.nis,
            full_name: formData.full_name,
            phone: formData.phone || null,
            address: formData.address || null,
            gender: 'L', // Default, can be updated later
            status: 'active'
          });

        if (studentError) {
          console.error('Student error:', studentError);
          throw studentError;
        }

        console.log('Student record created successfully');
      }

      toast({
        title: "Berhasil",
        description: "Pengguna berhasil ditambahkan. Mereka akan menerima email konfirmasi untuk mengaktifkan akun."
      });

      // Reset form
      setFormData({
        email: '',
        password: '',
        full_name: '',
        nip: '',
        nis: '',
        phone: '',
        address: '',
        role: '' as AppRole | ''
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan pengguna",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="email@example.com"
                className="w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                placeholder="Minimal 8 karakter"
                minLength={8}
                className="w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
                className="w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as AppRole }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'siswa' ? (
              <div className="sm:col-span-2">
                <Label htmlFor="nis">NIS</Label>
                <Input
                  id="nis"
                  value={formData.nis}
                  onChange={(e) => setFormData(prev => ({ ...prev, nis: e.target.value }))}
                  placeholder="Nomor Induk Siswa"
                  className="w-full"
                />
              </div>
            ) : (
              <div className="sm:col-span-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                  placeholder="Nomor Induk Pegawai"
                  className="w-full"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="08xxxxxxxxxx"
                className="w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Alamat lengkap"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Tambah Pengguna
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="sm:w-auto"
            >
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
