import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StudentWithClass } from '@/types/student';

interface AchievementType {
  id: string;
  name: string;
  category: string;
  level: string;
  point_reward: number;
}

export const AchievementRecorder = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [achievementTypes, setAchievementTypes] = useState<AchievementType[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    achievement_type_id: '',
    achievement_date: new Date(),
    description: '',
    certificate_url: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchAchievementTypes();
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

  const fetchAchievementTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('achievement_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAchievementTypes(data || []);
    } catch (error) {
      console.error('Error fetching achievement types:', error);
      toast({
        title: "Error",
        description: "Gagal memuat jenis prestasi",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRole('admin') && !hasRole('wali_kelas')) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mencatat prestasi",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('student_achievements')
        .insert({
          student_id: formData.student_id,
          achievement_type_id: formData.achievement_type_id,
          achievement_date: format(formData.achievement_date, 'yyyy-MM-dd'),
          description: formData.description,
          certificate_url: formData.certificate_url,
          recorded_by: user?.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Prestasi berhasil dicatat dan menunggu verifikasi"
      });

      // Reset form
      setFormData({
        student_id: '',
        achievement_type_id: '',
        achievement_date: new Date(),
        description: '',
        certificate_url: ''
      });
    } catch (error) {
      console.error('Error recording achievement:', error);
      toast({
        title: "Error",
        description: "Gagal mencatat prestasi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `achievement-${Date.now()}.${fileExt}`;
      const filePath = `achievements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, certificate_url: publicUrl }));

      toast({
        title: "Berhasil",
        description: "File sertifikat berhasil diunggah"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Gagal mengunggah file",
        variant: "destructive"
      });
    }
  };

  if (!hasRole('admin') && !hasRole('wali_kelas')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">
            Anda tidak memiliki akses untuk mencatat prestasi siswa
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catat Prestasi Siswa</CardTitle>
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
            <Label htmlFor="achievement_type">Jenis Prestasi</Label>
            <Select value={formData.achievement_type_id} onValueChange={(value) => setFormData(prev => ({ ...prev, achievement_type_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis prestasi" />
              </SelectTrigger>
              <SelectContent>
                {achievementTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} - {type.level} (+{type.point_reward} poin)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tanggal Prestasi</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.achievement_date, 'dd MMMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.achievement_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, achievement_date: date }))}
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
              placeholder="Deskripsi prestasi..."
            />
          </div>

          <div>
            <Label htmlFor="certificate">Sertifikat/Bukti</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <Button type="button" variant="outline" size="sm">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {formData.certificate_url && (
              <p className="text-sm text-green-600 mt-1">File berhasil diunggah</p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Menyimpan...' : 'Catat Prestasi'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
