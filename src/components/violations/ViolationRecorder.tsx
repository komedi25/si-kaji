import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StudentWithClass } from '@/types/student';

interface ViolationType {
  id: string;
  name: string;
  category: string;
  point_deduction: number;
}

export const ViolationRecorder = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    violation_type_id: '',
    violation_date: new Date(),
    description: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchViolationTypes();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
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
        .eq('student_enrollments.status', 'active')
        .order('full_name');

      if (error) throw error;

      // Transform data to match StudentWithClass interface
      const studentsWithClass = (data || []).map((student: any): StudentWithClass => {
        const enrollment = student.student_enrollments?.[0];
        return {
          ...student,
          current_class: enrollment?.classes ? 
            `${enrollment.classes.grade} ${enrollment.classes.name}` : '-'
        };
      });

      setStudents(studentsWithClass);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive"
      });
    }
  };

  const fetchViolationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('violation_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setViolationTypes(data || []);
    } catch (error) {
      console.error('Error fetching violation types:', error);
      toast({
        title: "Error",
        description: "Gagal memuat jenis pelanggaran",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRole('admin') && !hasRole('wali_kelas') && !hasRole('tppk')) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mencatat pelanggaran",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('student_violations')
        .insert({
          student_id: formData.student_id,
          violation_type_id: formData.violation_type_id,
          violation_date: format(formData.violation_date, 'yyyy-MM-dd'),
          description: formData.description,
          reported_by: user?.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pelanggaran berhasil dicatat"
      });

      // Reset form
      setFormData({
        student_id: '',
        violation_type_id: '',
        violation_date: new Date(),
        description: ''
      });
    } catch (error) {
      console.error('Error recording violation:', error);
      toast({
        title: "Error",
        description: "Gagal mencatat pelanggaran",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasRole('admin') && !hasRole('wali_kelas') && !hasRole('tppk')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">
            Anda tidak memiliki akses untuk mencatat pelanggaran siswa
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catat Pelanggaran Siswa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="student">Siswa</Label>
            <Select value={formData.student_id} onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih siswa" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name} - {student.current_class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="violation_type">Jenis Pelanggaran</Label>
            <Select value={formData.violation_type_id} onValueChange={(value) => setFormData(prev => ({ ...prev, violation_type_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis pelanggaran" />
              </SelectTrigger>
              <SelectContent>
                {violationTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} - {type.category} (-{type.point_deduction} poin)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tanggal Pelanggaran</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.violation_date, 'dd MMMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.violation_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, violation_date: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Deskripsi pelanggaran..."
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Menyimpan...' : 'Catat Pelanggaran'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
