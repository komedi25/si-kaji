import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Major, Class, StudentWithClass } from '@/types/student';

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentWithClass;
  onSuccess: () => void;
  majors: Major[];
  classes: Class[];
}

export function EditStudentDialog({ open, onOpenChange, student, onSuccess, majors, classes }: EditStudentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [birthDate, setBirthDate] = useState<Date>();
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    full_name: '',
    gender: '',
    birth_place: '',
    religion: '',
    address: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    parent_address: '',
    status: '',
    class_id: ''
  });

  useEffect(() => {
    if (student) {
      setFormData({
        nis: student.nis || '',
        nisn: student.nisn || '',
        full_name: student.full_name || '',
        gender: student.gender || '',
        birth_place: student.birth_place || '',
        religion: student.religion || '',
        address: student.address || '',
        phone: student.phone || '',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
        parent_address: student.parent_address || '',
        status: student.status || '',
        class_id: student.current_class?.id || ''
      });

      if (student.birth_date) {
        setBirthDate(parseISO(student.birth_date));
      }
    }
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nis || !formData.full_name || !formData.gender) {
      toast({
        title: "Error",
        description: "Harap lengkapi semua field yang wajib diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Update student data
      const { error: studentError } = await supabase
        .from('students')
        .update({
          nis: formData.nis,
          nisn: formData.nisn || null,
          full_name: formData.full_name,
          gender: formData.gender as 'L' | 'P',
          birth_place: formData.birth_place || null,
          birth_date: birthDate ? format(birthDate, 'yyyy-MM-dd') : null,
          religion: formData.religion || null,
          address: formData.address || null,
          phone: formData.phone || null,
          parent_name: formData.parent_name || null,
          parent_phone: formData.parent_phone || null,
          parent_address: formData.parent_address || null,
          status: formData.status
        })
        .eq('id', student.id);

      if (studentError) throw studentError;

      // Update enrollment if class changed
      if (formData.class_id && formData.class_id !== student.current_class?.id) {
        const { error: enrollmentError } = await supabase
          .from('student_enrollments')
          .update({
            class_id: formData.class_id
          })
          .eq('student_id', student.id)
          .eq('status', 'active');

        if (enrollmentError) throw enrollmentError;
      }

      toast({
        title: "Berhasil",
        description: "Data siswa berhasil diperbarui"
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: error.message === 'duplicate key value violates unique constraint "students_nis_key"'
          ? "NIS sudah digunakan oleh siswa lain"
          : "Gagal memperbarui data siswa",
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
            Perbarui informasi data siswa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nis">NIS *</Label>
              <Input
                id="nis"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Nomor Induk Siswa"
                required
              />
            </div>
            <div>
              <Label htmlFor="nisn">NISN</Label>
              <Input
                id="nisn"
                value={formData.nisn}
                onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                placeholder="Nomor Induk Siswa Nasional"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="full_name">Nama Lengkap *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Nama lengkap siswa"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="gender">Jenis Kelamin *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="class_id">Kelas</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name} - {classItem.major?.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="graduated">Lulus</SelectItem>
                  <SelectItem value="transferred">Pindah</SelectItem>
                  <SelectItem value="dropped">Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_place">Tempat Lahir</Label>
              <Input
                id="birth_place"
                value={formData.birth_place}
                onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                placeholder="Tempat lahir"
              />
            </div>
            <div>
              <Label>Tanggal Lahir</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "dd/MM/yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="religion">Agama</Label>
              <Select value={formData.religion} onValueChange={(value) => setFormData({ ...formData, religion: value })}>
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
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Nomor telepon siswa"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat lengkap siswa"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parent_name">Nama Orang Tua</Label>
              <Input
                id="parent_name"
                value={formData.parent_name}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                placeholder="Nama orang tua/wali"
              />
            </div>
            <div>
              <Label htmlFor="parent_phone">No. Telepon Orang Tua</Label>
              <Input
                id="parent_phone"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                placeholder="Nomor telepon orang tua"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="parent_address">Alamat Orang Tua</Label>
            <Textarea
              id="parent_address"
              value={formData.parent_address}
              onChange={(e) => setFormData({ ...formData, parent_address: e.target.value })}
              placeholder="Alamat orang tua/wali"
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
}
