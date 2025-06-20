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
  const [actualStudentId, setActualStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (open && studentData) {
      console.log('Dialog opened with student data:', studentData);
      findAndLoadStudentData();
      fetchClasses();
    }
  }, [open, studentData]);

  const findAndLoadStudentData = async () => {
    console.log('Starting findAndLoadStudentData with:', studentData);
    
    try {
      let studentRecord = null;

      // Strategy 1: If we have student_id from the userData, use it directly
      if (studentData.student_id) {
        console.log('Strategy 1: Using student_id:', studentData.student_id);
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentData.student_id)
          .maybeSingle();

        if (!error && data) {
          studentRecord = data;
          setActualStudentId(data.id);
          console.log('Found student by student_id:', data);
        }
      }

      // Strategy 2: If no student_id but we have NIS, search by NIS
      if (!studentRecord && studentData.nis) {
        console.log('Strategy 2: Searching by NIS:', studentData.nis);
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('nis', studentData.nis)
          .maybeSingle();

        if (!error && data) {
          studentRecord = data;
          setActualStudentId(data.id);
          console.log('Found student by NIS:', data);
        }
      }

      // Strategy 3: If user has account and no student record found, search by user_id
      if (!studentRecord && studentData.has_user_account && studentData.id) {
        console.log('Strategy 3: Searching by user_id:', studentData.id);
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('user_id', studentData.id)
          .maybeSingle();

        if (!error && data) {
          studentRecord = data;
          setActualStudentId(data.id);
          console.log('Found student by user_id:', data);
        }
      }

      // Strategy 4: Search by full name as last resort
      if (!studentRecord && studentData.full_name) {
        console.log('Strategy 4: Searching by full_name:', studentData.full_name);
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('full_name', studentData.full_name)
          .maybeSingle();

        if (!error && data) {
          studentRecord = data;
          setActualStudentId(data.id);
          console.log('Found student by full_name:', data);
        }
      }

      if (!studentRecord) {
        console.error('No student record found using any strategy');
        toast({
          title: "Data Tidak Ditemukan",
          description: "Data siswa tidak ditemukan di database. Pastikan data siswa sudah ada sebelum membuat akun pengguna.",
          variant: "destructive"
        });
        return;
      }

      // Load the student data into form
      console.log('Loading student data into form:', studentRecord);
      setFormData({
        full_name: studentRecord.full_name || '',
        nis: studentRecord.nis || '',
        nisn: studentRecord.nisn || '',
        phone: studentRecord.phone || '',
        address: studentRecord.address || '',
        birth_place: studentRecord.birth_place || '',
        birth_date: studentRecord.birth_date || '',
        gender: (studentRecord.gender as 'L' | 'P') || 'L',
        religion: studentRecord.religion || '',
        parent_name: studentRecord.parent_name || '',
        parent_phone: studentRecord.parent_phone || '',
        parent_address: studentRecord.parent_address || '',
        status: (studentRecord.status as 'active' | 'graduated' | 'transferred' | 'dropped') || 'active'
      });

      // Get current class enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('class_id')
        .eq('student_id', studentRecord.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!enrollmentError && enrollment) {
        console.log('Current enrollment found:', enrollment);
        setSelectedClassId(enrollment.class_id);
      } else {
        console.log('No active enrollment found for student');
      }

    } catch (error) {
      console.error('Error in findAndLoadStudentData:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa: " + (error as Error).message,
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
    console.log('Form submitted with data:', formData);
    
    if (!actualStudentId) {
      toast({
        title: "Error",
        description: "ID siswa tidak ditemukan. Pastikan data siswa valid.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Updating student with ID:', actualStudentId);
      
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
        .eq('id', actualStudentId);

      if (studentError) {
        console.error('Error updating student:', studentError);
        throw studentError;
      }

      console.log('Student data updated successfully');

      // Update profile if student has user account
      if (studentData.has_user_account && studentData.id) {
        console.log('Updating profile for user ID:', studentData.id);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            nis: formData.nis,
            phone: formData.phone || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', studentData.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          console.log('Profile update failed, but continuing...');
        } else {
          console.log('Profile updated successfully');
        }
      }

      // Update class enrollment if changed
      if (selectedClassId) {
        console.log('Updating class enrollment to:', selectedClassId);
        
        // Deactivate current enrollment
        await supabase
          .from('student_enrollments')
          .update({ status: 'inactive' })
          .eq('student_id', actualStudentId)
          .eq('status', 'active');

        // Create new enrollment
        const { error: enrollmentError } = await supabase
          .from('student_enrollments')
          .insert({
            student_id: actualStudentId,
            class_id: selectedClassId,
            status: 'active',
            enrollment_date: new Date().toISOString().split('T')[0]
          });

        if (enrollmentError) {
          console.error('Error updating enrollment:', enrollmentError);
          console.log('Enrollment update failed, but continuing...');
        } else {
          console.log('Class enrollment updated successfully');
        }
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
            <br />
            <span className="text-xs text-gray-500">
              Student ID: {actualStudentId || 'Mencari data...'}
            </span>
            {!actualStudentId && (
              <div className="text-xs text-orange-600 mt-1">
                ⚠️ Jika data tidak ditemukan, pastikan data siswa sudah ada di sistem sebelum membuat akun pengguna
              </div>
            )}
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
              <Select value={formData.status} onValueChange={(value: 'active' | 'graduated' | 'transferred' | 'dropped') => setFormData(prev => ({ ...prev, status: value }))}>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || !actualStudentId}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
