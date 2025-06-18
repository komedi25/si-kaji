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

export const PermitForm = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    permit_type: '',
    start_date: new Date(),
    end_date: new Date(),
    reason: '',
    supporting_document_url: ''
  });

  useEffect(() => {
    if (hasRole('admin') || hasRole('wali_kelas')) {
      fetchStudents();
    }
  }, [hasRole]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const studentId = hasRole('siswa') ? user?.profile?.id : formData.student_id;
      
      if (!studentId) {
        throw new Error('Student ID is required');
      }

      const { error } = await supabase
        .from('student_permits')
        .insert({
          student_id: studentId,
          permit_type: formData.permit_type,
          start_date: format(formData.start_date, 'yyyy-MM-dd'),
          end_date: format(formData.end_date, 'yyyy-MM-dd'),
          reason: formData.reason,
          supporting_document_url: formData.supporting_document_url,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Permohonan izin berhasil diajukan"
      });

      // Reset form
      setFormData({
        student_id: '',
        permit_type: '',
        start_date: new Date(),
        end_date: new Date(),
        reason: '',
        supporting_document_url: ''
      });
    } catch (error) {
      console.error('Error submitting permit:', error);
      toast({
        title: "Error",
        description: "Gagal mengajukan permohonan izin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `permit-${Date.now()}.${fileExt}`;
      const filePath = `permits/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, supporting_document_url: publicUrl }));

      toast({
        title: "Berhasil",
        description: "Dokumen pendukung berhasil diunggah"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Gagal mengunggah dokumen",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Permohonan Izin</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(hasRole('admin') || hasRole('wali_kelas')) && (
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
          )}

          <div>
            <Label htmlFor="permit_type">Jenis Izin</Label>
            <Select value={formData.permit_type} onValueChange={(value) => setFormData(prev => ({ ...prev, permit_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis izin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sakit">Sakit</SelectItem>
                <SelectItem value="izin">Izin</SelectItem>
                <SelectItem value="dispensasi">Dispensasi</SelectItem>
                <SelectItem value="keperluan_keluarga">Keperluan Keluarga</SelectItem>
                <SelectItem value="lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tanggal Mulai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.start_date, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, start_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Tanggal Selesai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.end_date, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, end_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Alasan</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Jelaskan alasan permohonan izin..."
              required
            />
          </div>

          <div>
            <Label htmlFor="document">Dokumen Pendukung</Label>
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
            {formData.supporting_document_url && (
              <p className="text-sm text-green-600 mt-1">Dokumen berhasil diunggah</p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Mengajukan...' : 'Ajukan Permohonan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
