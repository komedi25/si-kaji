
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
    { value: 'penanggung_jawab_sarpras', label: 'Penanggung Jawab Sarpras' },
    { value: 'osis', label: 'OSIS' }
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

    setLoading(true);
    try {
      // Create profile first (since we can't create auth users directly)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          full_name: formData.full_name,
          nip: formData.role === 'siswa' ? null : formData.nip || null,
          nis: formData.role === 'siswa' ? formData.nis || null : null,
          phone: formData.phone || null,
          address: formData.address || null
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: formData.role
        });

      if (roleError) throw roleError;

      // If role is student, create student record
      if (formData.role === 'siswa' && formData.nis) {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: profile.id,
            nis: formData.nis,
            full_name: formData.full_name,
            phone: formData.phone || null,
            address: formData.address || null,
            gender: 'male', // Default, can be updated later
            status: 'active'
          });

        if (studentError) throw studentError;
      }

      toast({
        title: "Berhasil",
        description: "Pengguna berhasil ditambahkan. Data dapat diperbarui setelah pengguna login."
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Pengguna Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nama Lengkap *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as AppRole }))}>
              <SelectTrigger>
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
            <div>
              <Label htmlFor="nis">NIS</Label>
              <Input
                id="nis"
                value={formData.nis}
                onChange={(e) => setFormData(prev => ({ ...prev, nis: e.target.value }))}
                placeholder="Nomor Induk Siswa"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={formData.nip}
                onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                placeholder="Nomor Induk Pegawai"
              />
            </div>
          )}

          <div>
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Alamat lengkap"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Tambah Pengguna
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
