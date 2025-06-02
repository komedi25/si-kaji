
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Download, Calendar } from 'lucide-react';
import { Class } from '@/types/student';
import { StudentAttendance } from '@/types/attendance';

export const AttendanceReport = () => {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*, majors(name)')
        .eq('is_active', true)
        .order('grade', { ascending: true });
      
      if (error) throw error;
      return data as Class[];
    }
  });

  const { data: attendanceReport, isLoading } = useQuery({
    queryKey: ['attendance-report', selectedClassId, startDate, endDate],
    queryFn: async () => {
      if (!selectedClassId || !startDate || !endDate) return [];
      
      const { data, error } = await supabase
        .from('student_attendances')
        .select(`
          *,
          students(id, full_name, nis)
        `)
        .eq('class_id', selectedClassId)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: true });
      
      if (error) throw error;
      return data as (StudentAttendance & { students: any })[];
    },
    enabled: !!selectedClassId && !!startDate && !!endDate
  });

  const getAttendanceSummary = () => {
    if (!attendanceReport) return null;

    const summary = attendanceReport.reduce((acc, record) => {
      const studentId = record.student_id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: record.students,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0
        };
      }
      
      acc[studentId][record.status as keyof typeof acc[string]]++;
      acc[studentId].total++;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(summary);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'Hadir', variant: 'default' as const },
      absent: { label: 'Tidak Hadir', variant: 'destructive' as const },
      late: { label: 'Terlambat', variant: 'secondary' as const },
      excused: { label: 'Izin', variant: 'outline' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? (
      <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
    ) : null;
  };

  const attendanceSummary = getAttendanceSummary();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="startDate">Tanggal Mulai</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="endDate">Tanggal Selesai</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
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
      </div>

      {selectedClassId && !isLoading && attendanceSummary && (
        <>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 mt-6">
              <Calendar className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                Laporan Presensi {format(new Date(startDate), 'dd/MM/yyyy')} - {format(new Date(endDate), 'dd/MM/yyyy')} 
              </h3>
            </div>
            
            <Button disabled className="opacity-50" title="Fitur akan datang">
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full mt-2 border-collapse">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-4 py-3 text-left">Nama Siswa</th>
                  <th className="px-4 py-3 text-left">NIS</th>
                  <th className="px-4 py-3 text-center">Hadir</th>
                  <th className="px-4 py-3 text-center">Tidak Hadir</th>
                  <th className="px-4 py-3 text-center">Terlambat</th>
                  <th className="px-4 py-3 text-center">Izin</th>
                  <th className="px-4 py-3 text-center">% Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {attendanceSummary.map((summary, index) => {
                  const attendanceRate = summary.total > 0 
                    ? ((summary.present + summary.excused) / summary.total * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <tr key={summary.student.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">{summary.student.full_name}</td>
                      <td className="px-4 py-3">{summary.student.nis}</td>
                      <td className="px-4 py-3 text-center">{summary.present}</td>
                      <td className="px-4 py-3 text-center">{summary.absent}</td>
                      <td className="px-4 py-3 text-center">{summary.late}</td>
                      <td className="px-4 py-3 text-center">{summary.excused}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          Number(attendanceRate) >= 90 ? 'default' :
                          Number(attendanceRate) >= 75 ? 'secondary' :
                          'destructive'
                        }>
                          {attendanceRate}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
