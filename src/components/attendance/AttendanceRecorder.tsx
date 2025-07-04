
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { StudentSearchWithQR } from '@/components/common/StudentSearchWithQR';

interface Student {
  id: string;
  full_name: string;
  nis: string;
}

export const AttendanceRecorder = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    attendance_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'present' as 'present' | 'absent' | 'sick' | 'permission',
    notes: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('students')
        .select('id, full_name, nis')
        .eq('status', 'active')
        .order('full_name');

      // Jika wali kelas, hanya tampilkan siswa perwaliannya
      if (hasRole('wali_kelas') && !hasRole('admin') && !hasRole('tppk')) {
        query = query.in('id', await getHomeRoomStudentIds());
      }

      const { data, error } = await query;
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getHomeRoomStudentIds = async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          student_enrollments!inner(student_id)
        `)
        .eq('homeroom_teacher_id', user?.id)
        .eq('student_enrollments.status', 'active');

      if (error) throw error;
      
      return data?.flatMap(cls => 
        cls.student_enrollments.map(enrollment => enrollment.student_id)
      ) || [];
    } catch (error) {
      console.error('Error fetching homeroom students:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasRole('admin') && !hasRole('tppk') && !hasRole('wali_kelas')) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mencatat presensi",
        variant: "destructive"
      });
      return;
    }

    if (!formData.student_id || !formData.attendance_date) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Harap pilih siswa dan tanggal presensi",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Check if attendance already exists
      const { data: existing } = await supabase
        .from('student_attendances')
        .select('id')
        .eq('student_id', formData.student_id)
        .eq('attendance_date', formData.attendance_date)
        .single();

      if (existing) {
        // Update existing attendance
        const { error } = await supabase
          .from('student_attendances')
          .update({
            status: formData.status,
            notes: formData.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Data presensi berhasil diperbarui",
        });
      } else {
        // Create new attendance record
        const { error } = await supabase
          .from('student_attendances')
          .insert({
            student_id: formData.student_id,
            attendance_date: formData.attendance_date,
            status: formData.status,
            notes: formData.notes || null,
            recorded_by: user?.id
          });

        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Data presensi berhasil dicatat",
        });
      }

      // Reset form
      setFormData({
        student_id: '',
        attendance_date: format(new Date(), 'yyyy-MM-dd'),
        status: 'present',
        notes: ''
      });
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast({
        title: "Error",
        description: "Gagal mencatat presensi",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasRole('admin') && !hasRole('tppk') && !hasRole('wali_kelas')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-orange-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Akses Terbatas</h3>
              <p className="text-gray-500 mt-2">
                Anda tidak memiliki akses untuk mencatat presensi siswa. 
                Fitur ini hanya tersedia untuk wali kelas, TPPK, dan administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-blue-500" />
          Input Presensi Manual
          {hasRole('wali_kelas') && !hasRole('admin') && !hasRole('tppk') && (
            <span className="text-sm font-normal text-gray-500">(Siswa Perwalian)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Siswa *</Label>
            <StudentSearchWithQR
              value={formData.student_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
              placeholder={hasRole('wali_kelas') && !hasRole('admin') && !hasRole('tppk') 
                ? "Cari siswa perwalian Anda..." 
                : "Cari siswa berdasarkan nama atau NIS"
              }
              students={students}
            />
          </div>

          <div>
            <Label htmlFor="attendance_date">Tanggal Presensi *</Label>
            <Input
              id="attendance_date"
              type="date"
              value={formData.attendance_date}
              onChange={(e) => setFormData(prev => ({ ...prev, attendance_date: e.target.value }))}
              max={format(new Date(), 'yyyy-MM-dd')}
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Status Kehadiran *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'present' | 'absent' | 'sick' | 'permission') => 
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Hadir
                  </div>
                </SelectItem>
                <SelectItem value="sick">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    Sakit
                  </div>
                </SelectItem>
                <SelectItem value="permission">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Izin
                  </div>
                </SelectItem>
                <SelectItem value="absent">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Alfa (Tanpa Keterangan)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Catatan tambahan..."
            />
          </div>

          <Button 
            type="submit" 
            disabled={submitting || !formData.student_id || !formData.attendance_date} 
            className="w-full"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Presensi'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
