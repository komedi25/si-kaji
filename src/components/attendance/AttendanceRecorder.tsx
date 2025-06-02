import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Save, Users } from 'lucide-react';
import { Class } from '@/types/student';
import { StudentAttendance } from '@/types/attendance';

export const AttendanceRecorder = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*, majors(name), academic_years(name)')
        .eq('is_active', true)
        .order('grade', { ascending: true });
      
      if (error) throw error;
      return data as Class[];
    }
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-by-class', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      
      const { data, error } = await supabase
        .from('student_enrollments')
        .select(`
          student_id,
          students(id, full_name, nis)
        `)
        .eq('class_id', selectedClassId)
        .eq('status', 'active');
      
      if (error) throw error;
      return data.map(enrollment => enrollment.students).filter(Boolean);
    },
    enabled: !!selectedClassId
  });

  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance', selectedClassId, selectedDate],
    queryFn: async () => {
      if (!selectedClassId || !selectedDate) return [];
      
      const { data, error } = await supabase
        .from('student_attendances')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('attendance_date', selectedDate);
      
      if (error) throw error;
      return data as StudentAttendance[];
    },
    enabled: !!selectedClassId && !!selectedDate
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceRecords: any[]) => {
      const { error } = await supabase
        .from('student_attendances')
        .upsert(attendanceRecords, {
          onConflict: 'student_id,attendance_date'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast({ title: 'Presensi berhasil disimpan' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = () => {
    if (!selectedClassId || !selectedDate) {
      toast({
        title: 'Error',
        description: 'Pilih kelas dan tanggal terlebih dahulu',
        variant: 'destructive'
      });
      return;
    }

    const records = Object.entries(attendanceData).map(([studentId, status]) => ({
      student_id: studentId,
      class_id: selectedClassId,
      attendance_date: selectedDate,
      status: status,
      recorded_at: new Date().toISOString()
    }));

    if (records.length === 0) {
      toast({
        title: 'Error',
        description: 'Belum ada data presensi yang diinput',
        variant: 'destructive'
      });
      return;
    }

    saveAttendanceMutation.mutate(records);
  };

  // Set initial attendance data from existing records
  useEffect(() => {
    if (existingAttendance) {
      const initial: Record<string, string> = {};
      existingAttendance.forEach(record => {
        initial[record.student_id] = record.status;
      });
      setAttendanceData(initial);
    }
  }, [existingAttendance]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'Hadir', variant: 'default' as const },
      absent: { label: 'Tidak Hadir', variant: 'destructive' as const },
      late: { label: 'Terlambat', variant: 'secondary' as const },
      excused: { label: 'Izin', variant: 'outline' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? (
      <Badge variant={config.variant}>{config.label}</Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="date">Tanggal</Label>
          <Input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="class">Kelas</Label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - {cls.major?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button 
            onClick={handleSaveAttendance}
            disabled={!selectedClassId || !selectedDate || saveAttendanceMutation.isPending}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Simpan Presensi
          </Button>
        </div>
      </div>

      {selectedClassId && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              Daftar Siswa ({students?.length || 0} siswa)
            </h3>
          </div>

          {studentsLoading ? (
            <div>Loading siswa...</div>
          ) : (
            <div className="space-y-2">
              {students?.map((student: any) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{student.full_name}</div>
                    <div className="text-sm text-gray-500">NIS: {student.nis}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select 
                      value={attendanceData[student.id] || 'present'} 
                      onValueChange={(value) => handleAttendanceChange(student.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Hadir</SelectItem>
                        <SelectItem value="absent">Tidak Hadir</SelectItem>
                        <SelectItem value="late">Terlambat</SelectItem>
                        <SelectItem value="excused">Izin</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {attendanceData[student.id] && getStatusBadge(attendanceData[student.id])}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
