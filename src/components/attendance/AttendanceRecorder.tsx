
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, Save, Clock } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  nis: string;
}

interface Class {
  id: string;
  name: string;
  grade: number;
}

export function AttendanceRecorder() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      checkExistingAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, grade')
        .eq('is_active', true)
        .order('grade', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kelas",
        variant: "destructive"
      });
    }
  };

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          students (
            id,
            full_name,
            nis
          )
        `)
        .eq('class_id', selectedClass)
        .eq('status', 'active');

      if (error) throw error;
      
      const studentData = data?.map(enrollment => enrollment.students).filter(Boolean) || [];
      setStudents(studentData as Student[]);
      
      // Initialize attendance state
      const initialAttendance: Record<string, string> = {};
      studentData.forEach(student => {
        if (student) {
          initialAttendance[student.id] = 'present';
        }
      });
      setAttendance(initialAttendance);
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

  const checkExistingAttendance = async () => {
    if (!selectedClass || !selectedDate) return;

    try {
      const { data, error } = await supabase
        .from('unified_attendances')
        .select('student_id, status')
        .eq('class_id', selectedClass)
        .eq('attendance_date', selectedDate);

      if (error) throw error;

      if (data && data.length > 0) {
        const existingAttendance: Record<string, string> = {};
        data.forEach(record => {
          existingAttendance[record.student_id] = record.status;
        });
        setAttendance(prev => ({ ...prev, ...existingAttendance }));
      }
    } catch (error) {
      console.error('Error checking existing attendance:', error);
    }
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast({
        title: "Error",
        description: "Pilih kelas dan tanggal terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare attendance records
      const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        class_id: selectedClass,
        attendance_date: selectedDate,
        status,
        recorded_by: user?.id,
        recorded_at: new Date().toISOString()
      }));

      // Delete existing records for this date and class
      await supabase
        .from('unified_attendances')
        .delete()
        .eq('class_id', selectedClass)
        .eq('attendance_date', selectedDate);

      // Insert new records
      const { error } = await supabase
        .from('unified_attendances')
        .insert(attendanceRecords);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: `Presensi untuk ${students.length} siswa berhasil disimpan`
      });
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan presensi",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'late': return 'secondary';
      case 'sick': return 'outline';
      case 'permission': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Hadir';
      case 'absent': return 'Tidak Hadir';
      case 'late': return 'Terlambat';
      case 'sick': return 'Sakit';
      case 'permission': return 'Izin';
      default: return status;
    }
  };

  const attendanceStats = {
    present: Object.values(attendance).filter(status => status === 'present').length,
    absent: Object.values(attendance).filter(status => status === 'absent').length,
    late: Object.values(attendance).filter(status => status === 'late').length,
    sick: Object.values(attendance).filter(status => status === 'sick').length,
    permission: Object.values(attendance).filter(status => status === 'permission').length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Input Presensi Harian
          </CardTitle>
          <CardDescription>
            Pilih kelas dan tanggal untuk mencatat kehadiran siswa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Kelas</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} (Kelas {cls.grade})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Statistics */}
          {students.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-700">{attendanceStats.present}</div>
                <div className="text-xs text-green-600">Hadir</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="text-lg font-bold text-red-700">{attendanceStats.absent}</div>
                <div className="text-xs text-red-600">Tidak Hadir</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="text-lg font-bold text-yellow-700">{attendanceStats.late}</div>
                <div className="text-xs text-yellow-600">Terlambat</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-700">{attendanceStats.sick}</div>
                <div className="text-xs text-blue-600">Sakit</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-700">{attendanceStats.permission}</div>
                <div className="text-xs text-purple-600">Izin</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student List */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Siswa ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Memuat data siswa...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada siswa dalam kelas ini
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                        {student.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-sm text-muted-foreground">NIS: {student.nis}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={attendance[student.id] || 'present'}
                        onValueChange={(value) => handleAttendanceChange(student.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Hadir</SelectItem>
                          <SelectItem value="absent">Tidak Hadir</SelectItem>
                          <SelectItem value="late">Terlambat</SelectItem>
                          <SelectItem value="sick">Sakit</SelectItem>
                          <SelectItem value="permission">Izin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Badge variant={getStatusBadgeVariant(attendance[student.id] || 'present')}>
                        {getStatusLabel(attendance[student.id] || 'present')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      {students.length > 0 && (
        <div className="flex justify-end">
          <Button 
            onClick={saveAttendance} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan Presensi'}
          </Button>
        </div>
      )}
    </div>
  );
}
