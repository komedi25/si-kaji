
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AllUserData } from '@/types/user';
import { Loader2 } from 'lucide-react';

interface EditStudentDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentData: AllUserData;
  onSuccess: () => void;
}

export const EditStudentDataDialog = ({ 
  open, 
  onOpenChange, 
  studentData, 
  onSuccess 
}: EditStudentDataDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    nis: '',
    nisn: '',
    phone: '',
    address: '',
    birth_place: '',
    birth_date: '',
    gender: 'L' as 'L' | 'P',
    religion: '',
    parent_name: '',
    parent_phone: '',
    parent_address: '',
    status: 'active' as 'active' | 'graduated' | 'transferred' | 'dropped'
  });
  const [classes, setClasses] = useState<Array<{ id: string; name: string; grade: number }>>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  useEffect(() => {
    if (open && studentData) {
      fetchStudentDetails();
      fetchClasses();
    }
  }, [open, studentData]);

  const fetchStudentDetails = async () => {
    if (!studentData.student_id) return;

    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentData.student_id)
        .single();

      if (error) throw error;

      if (student) {
        setFormData({
          full_name: student.full_name || '',
          nis: student.nis || '',
          nisn: student.nisn || '',
          phone: student.phone || '',
          address: student.address || '',
          birth_place: student.birth_place || '',
          birth_date: student.birth_date || '',
          gender: student.gender || 'L',
          religion: student.religion || '',
          parent_name: student.parent_name || '',
          parent_phone: student.parent_phone || '',
          parent_address: student.parent_address || '',
          status: student.status || 'active'
        });

        // Get current class enrollment
        const { data: enrollment } = await supabase
          .from('student_enrollments')
          .select('class_id')
          .eq('student_id', student.id)
          .eq('status', 'active')
          .single();

        if (enrollment) {
          setSelectedClassId(enrollment.class_id);
        }
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast({
        title: "Error",
        description: "Gagal memuat detail siswa",
        variant: "destructive"
      });
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade')
        .eq('is_active', true)
        .order('grade', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData.student_id) return;

    setLoading(true);
    try {
      // Update student data
      const { error: studentError } = await supabase
        .from('students')
        .update({
          full_name: formData.full_name,
          nis: formData.nis,
          nisn: formData.nisn || null,
          phone: formData.phone || null,
          address: formData.address || null,
          birth_place: formData.birth_place || null,
          birth_date: formData.birth_date || null,
          gender: formData.gender,
          religion: formData.religion || null,
          parent_name: formData.parent_name || null,
          parent_phone: formData.parent_phone || null,
          parent_address: formData.parent_address || null,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentData.student_id);

      if (studentError) throw studentError;

      // Update profile if exists
      if (studentData.has_user_account && studentData.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            nis: formData.nis,
            phone: formData.phone || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', studentData.id);

        if (profileError) throw profileError;
      }

      // Update class enrollment if changed
      if (selectedClassId) {
        // Deactivate current enrollment
        await supabase
          .from('student_enrollments')
          .update({ status: 'inactive' })
          .eq('student_id', studentData.student_id)
          .eq('status', 'active');

        // Create new enrollment
        const { error: enrollmentError } = await supabase
          .from('student_enrollments')
          .insert({
            student_id: studentData.student_id,
            class_id: selectedClassId,
            status: 'active',
            enrollment_date: new Date().toISOString().split('T')[0]
          });

        if (enrollmentError) throw enrollmentError;
      }

      toast({
        title: "Berhasil",
        description: "Data siswa berhasil diperbarui"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui data siswa: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Siswa</DialogTitle>
          <DialogDescription>
            Perbarui informasi data siswa {studentData.full_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="nis">NIS *</Label>
              <Input
                id="nis"
                value={formData.nis}
                onChange={(e) => setFormData(prev => ({ ...prev, nis: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="nisn">NISN</Label>
              <Input
                id="nisn"
                value={formData.nisn}
                onChange={(e) => setFormData(prev => ({ ...prev, nisn: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="gender">Jenis Kelamin *</Label>
              <Select value={formData.gender} onValueChange={(value: 'L' | 'P') => setFormData(prev => ({ ...prev, gender: value }))}>
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
              <Label htmlFor="birth_place">Tempat Lahir</Label>
              <Input
                id="birth_place"
                value={formData.birth_place}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_place: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="birth_date">Tanggal Lahir</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="religion">Agama</Label>
              <Select value={formData.religion} onValueChange={(value) => setFormData(prev => ({ ...prev, religion: value }))}>
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

            <div>
              <Label htmlFor="phone">No. Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="status">Status Siswa</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
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

            <div>
              <Label htmlFor="class">Kelas</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.grade} {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parent_name">Nama Orang Tua/Wali</Label>
              <Input
                id="parent_name"
                value={formData.parent_name}
                onChange={(e) => setFormData(prev => ({ ...prev, parent_name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="parent_phone">No. Telepon Orang Tua</Label>
              <Input
                id="parent_phone"
                value={formData.parent_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, parent_phone: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="parent_address">Alamat Orang Tua</Label>
            <Textarea
              id="parent_address"
              value={formData.parent_address}
              onChange={(e) => setFormData(prev => ({ ...prev, parent_address: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
