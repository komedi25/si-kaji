
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Attendance {
  id: string;
  date: string;
  extracurricular: string;
  student_id: string;
  student_name: string;
  status: 'hadir' | 'tidak_hadir' | 'izin' | 'sakit';
  notes?: string;
  created_by: string;
}

interface Student {
  id: string;
  full_name: string;
  nis: string;
  class: string;
}

interface Extracurricular {
  id: string;
  name: string;
  coach_id: string;
}

export function CoachAttendance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedExtracurricular, setSelectedExtracurricular] = useState('');

  useEffect(() => {
    loadExtracurriculars();
  }, []);

  useEffect(() => {
    if (selectedExtracurricular) {
      loadStudents();
      loadAttendances();
    }
  }, [selectedExtracurricular, selectedDate]);

  const loadExtracurriculars = async () => {
    try {
      const { data, error } = await supabase
        .from('extracurriculars')
        .select('*')
        .eq('coach_id', user?.id);

      if (error) throw error;
      setExtracurriculars(data || []);
      
      if (data && data.length > 0) {
        setSelectedExtracurricular(data[0].id);
      }
    } catch (error) {
      console.error('Error loading extracurriculars:', error);
    }
  };

  const loadStudents = async () => {
    if (!selectedExtracurricular) return;

    try {
      const { data, error } = await supabase
        .from('extracurricular_enrollments')
        .select(`
          student_id,
          students!inner (
            id,
            full_name,
            nis,
            class
          )
        `)
        .eq('extracurricular_id', selectedExtracurricular)
        .eq('status', 'active');

      if (error) throw error;
      
      const studentData = data?.map(enrollment => ({
        id: enrollment.student_id,
        full_name: enrollment.students.full_name,
        nis: enrollment.students.nis,
        class: enrollment.students.class
      })) || [];
      
      setStudents(studentData);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadAttendances = async () => {
    if (!selectedExtracurricular || !selectedDate) return;

    try {
      const selectedExt = extracurriculars.find(ext => ext.id === selectedExtracurricular);
      
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('extracurricular', selectedExt?.name || '')
        .eq('date', selectedDate);

      if (error) throw error;
      setAttendances(data || []);
    } catch (error) {
      console.error('Error loading attendances:', error);
    }
  };

  const saveAttendance = async (studentId: string, status: string) => {
    setLoading(true);
    try {
      const selectedExt = extracurriculars.find(ext => ext.id === selectedExtracurricular);
      const student = students.find(s => s.id === studentId);
      
      const existingAttendance = attendances.find(a => a.student_id === studentId);
      
      if (existingAttendance) {
        const { error } = await supabase
          .from('attendances')
          .update({ status })
          .eq('id', existingAttendance.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendances')
          .insert({
            date: selectedDate,
            extracurricular: selectedExt?.name || '',
            student_id: studentId,
            student_name: student?.full_name || '',
            status,
            created_by: user?.id
          });
        
        if (error) throw error;
      }

      toast({
        title: "Berhasil",
        description: "Absensi berhasil disimpan"
      });
      
      loadAttendances();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan absensi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    const attendance = attendances.find(a => a.student_id === studentId);
    return attendance?.status || '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hadir':
        return <Badge className="bg-green-100 text-green-800">Hadir</Badge>;
      case 'tidak_hadir':
        return <Badge className="bg-red-100 text-red-800">Tidak Hadir</Badge>;
      case 'izin':
        return <Badge className="bg-yellow-100 text-yellow-800">Izin</Badge>;
      case 'sakit':
        return <Badge className="bg-blue-100 text-blue-800">Sakit</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getAttendanceStats = () => {
    const totalStudents = students.length;
    const hadir = attendances.filter(a => a.status === 'hadir').length;
    const tidakHadir = attendances.filter(a => a.status === 'tidak_hadir').length;
    const izin = attendances.filter(a => a.status === 'izin').length;
    const sakit = attendances.filter(a => a.status === 'sakit').length;
    
    return { totalStudents, hadir, tidakHadir, izin, sakit };
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Absensi Ekstrakurikuler</h2>
        <p className="text-muted-foreground">
          Catat kehadiran siswa dalam kegiatan ekstrakurikuler
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ekstrakurikuler</Label>
          <Select value={selectedExtracurricular} onValueChange={setSelectedExtracurricular}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih ekstrakurikuler" />
            </SelectTrigger>
            <SelectContent>
              {extracurriculars.map((ext) => (
                <SelectItem key={ext.id} value={ext.id}>
                  {ext.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Tanggal</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {selectedExtracurricular && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <div className="text-sm text-muted-foreground">Total Siswa</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Check className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <div className="text-2xl font-bold">{stats.hadir}</div>
                  <div className="text-sm text-muted-foreground">Hadir</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <X className="w-8 h-8 mx-auto text-red-600 mb-2" />
                  <div className="text-2xl font-bold">{stats.tidakHadir}</div>
                  <div className="text-sm text-muted-foreground">Tidak Hadir</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                  <div className="text-2xl font-bold">{stats.izin}</div>
                  <div className="text-sm text-muted-foreground">Izin</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calendar className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">{stats.sakit}</div>
                  <div className="text-sm text-muted-foreground">Sakit</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Kehadiran</CardTitle>
              <CardDescription>
                {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: id })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada siswa terdaftar dalam ekstrakurikuler ini
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono">{student.nis}</TableCell>
                        <TableCell className="font-medium">{student.full_name}</TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>
                          {getStatusBadge(getAttendanceStatus(student.id))}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={getAttendanceStatus(student.id) === 'hadir' ? 'default' : 'outline'}
                              onClick={() => saveAttendance(student.id, 'hadir')}
                              disabled={loading}
                            >
                              Hadir
                            </Button>
                            <Button
                              size="sm"
                              variant={getAttendanceStatus(student.id) === 'tidak_hadir' ? 'destructive' : 'outline'}
                              onClick={() => saveAttendance(student.id, 'tidak_hadir')}
                              disabled={loading}
                            >
                              Alpha
                            </Button>
                            <Button
                              size="sm"
                              variant={getAttendanceStatus(student.id) === 'izin' ? 'secondary' : 'outline'}
                              onClick={() => saveAttendance(student.id, 'izin')}
                              disabled={loading}
                            >
                              Izin
                            </Button>
                            <Button
                              size="sm"
                              variant={getAttendanceStatus(student.id) === 'sakit' ? 'secondary' : 'outline'}
                              onClick={() => saveAttendance(student.id, 'sakit')}
                              disabled={loading}
                            >
                              Sakit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
