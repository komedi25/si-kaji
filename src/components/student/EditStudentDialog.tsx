
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { StudentWithClass, Major, Class } from '@/types/student';
import { StudentPhotoUpload } from './StudentPhotoUpload';

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentWithClass;
  onSuccess: () => void;
  majors: Major[];
  classes: Class[];
}

export const EditStudentDialog = ({
  open,
  onOpenChange,
  student,
  onSuccess,
  majors,
  classes
}: EditStudentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(student.photo_url || '');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nis: student.nis,
    nisn: student.nisn || '',
    full_name: student.full_name,
    gender: student.gender,
    birth_place: student.birth_place || '',
    birth_date: student.birth_date || '',
    religion: student.religion || '',
    address: student.address || '',
    phone: student.phone || '',
    parent_name: student.parent_name || '',
    parent_phone: student.parent_phone || '',
    parent_address: student.parent_address || '',
    status: student.status
  });

  useEffect(() => {
    setPhotoUrl(student.photo_url || '');
  }, [student.photo_url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('students')
        .update({
          ...formData,
          photo_url: photoUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data siswa berhasil diperbarui",
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memperbarui data siswa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Siswa</DialogTitle>
          <DialogDescription>
            Perbarui informasi siswa di bawah ini
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <StudentPhotoUpload
            student={student}
            onPhotoUploaded={setPhotoUrl}
            currentPhotoUrl={photoUrl}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nis">NIS *</Label>
              <Input
                id="nis"
                value={formData.nis}
                onChange={(e) => handleInputChange('nis', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="nisn">NISN</Label>
              <Input
                id="nisn"
                value={formData.nisn}
                onChange={(e) => handleInputChange('nisn', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="full_name">Nama Lengkap *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Jenis Kelamin *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="birth_date">Tanggal Lahir</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_place">Tempat Lahir</Label>
              <Input
                id="birth_place"
                value={formData.birth_place}
                onChange={(e) => handleInputChange('birth_place', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="religion">Agama</Label>
              <Select value={formData.religion} onValueChange={(value) => handleInputChange('religion', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih agama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Islam">Islam</SelectItem>
                  <SelectItem value="Kristen">Kristen</SelectItem>
                  <SelectItem value="Katolik">Katolik</SelectItem>
                  <SelectItem value="Hindu">Hindu</SelectItem>
                  <SelectItem value="Buddha">Buddha</SelectItem>
                  <SelectItem value="Konghucu">Konghucu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="parent_name">Nama Orang Tua/Wali</Label>
            <Input
              id="parent_name"
              value={formData.parent_name}
              onChange={(e) => handleInputChange('parent_name', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="parent_phone">Telepon Orang Tua/Wali</Label>
            <Input
              id="parent_phone"
              value={formData.parent_phone}
              onChange={(e) => handleInputChange('parent_phone', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="parent_address">Alamat Orang Tua/Wali</Label>
            <Textarea
              id="parent_address"
              value={formData.parent_address}
              onChange={(e) => handleInputChange('parent_address', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="graduated">Lulus</SelectItem>
                <SelectItem value="transferred">Pindah</SelectItem>
                <SelectItem value="dropped">Keluar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
