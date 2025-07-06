
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  QrCode, UserCheck, Clock, Calendar,
  MapPin, Users, AlertTriangle, CheckCircle
} from 'lucide-react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface AttendanceSession {
  id: string;
  extracurricular_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  qr_code: string;
  is_active: boolean;
  total_enrolled: number;
  total_present: number;
  attendance_rate: number;
}

interface StudentAttendance {
  id: string;
  student_name: string;
  student_nis: string;
  check_in_time?: string;
  status: 'present' | 'late' | 'absent';
  check_in_method: 'qr' | 'manual' | 'geofence';
}

export const AutomatedAttendanceSystem = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [qrCodeEnabled, setQrCodeEnabled] = useState(true);
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [autoAbsentEnabled, setAutoAbsentEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceSessions();
  }, [user]);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionAttendance();
    }
  }, [selectedSession]);

  const fetchAttendanceSessions = async () => {
    if (!user?.id) return;

    try {
      // Sample data for attendance sessions
      const sampleSessions: AttendanceSession[] = [
        {
          id: '1',
          extracurricular_name: 'Pramuka',
          session_date: format(new Date(), 'yyyy-MM-dd'),
          start_time: '14:00',
          end_time: '16:00',
          location: 'Lapangan Sekolah',
          qr_code: 'QR123456',
          is_active: true,
          total_enrolled: 25,
          total_present: 23,
          attendance_rate: 92
        },
        {
          id: '2',
          extracurricular_name: 'Basket',
          session_date: format(new Date(), 'yyyy-MM-dd'),
          start_time: '15:30',
          end_time: '17:30',
          location: 'GOR Sekolah',
          qr_code: 'QR789012',
          is_active: false,
          total_enrolled: 20,
          total_present: 18,
          attendance_rate: 90
        }
      ];

      setSessions(sampleSessions);
      if (sampleSessions.length > 0 && !selectedSession) {
        setSelectedSession(sampleSessions[0].id);
      }
    } catch (error) {
      console.error('Error fetching attendance sessions:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data sesi kehadiran',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionAttendance = async () => {
    if (!selectedSession) return;

    try {
      // Sample attendance data
      const sampleAttendance: StudentAttendance[] = [
        {
          id: '1',
          student_name: 'Ahmad Rizki',
          student_nis: '12345',
          check_in_time: '14:05',
          status: 'present',
          check_in_method: 'qr'
        },
        {
          id: '2',
          student_name: 'Siti Nurhaliza',
          student_nis: '12346',
          check_in_time: '14:20',
          status: 'late',
          check_in_method: 'manual'
        },
        {
          id: '3',
          student_name: 'Budi Santoso',
          student_nis: '12347',
          status: 'absent',
          check_in_method: 'qr'
        }
      ];

      setStudentAttendance(sampleAttendance);
    } catch (error) {
      console.error('Error fetching session attendance:', error);
    }
  };

  const generateQRCode = async (sessionId: string) => {
    try {
      const qrCode = `ESKUL_${sessionId}_${Date.now()}`;
      
      // Update session with new QR code
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, qr_code: qrCode, is_active: true }
          : session
      ));

      toast({
        title: 'QR Code Dibuat',
        description: 'QR Code baru untuk sesi kehadiran telah dibuat'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal membuat QR Code',
        variant: 'destructive'
      });
    }
  };

  const toggleSession = async (sessionId: string, isActive: boolean) => {
    try {
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, is_active: !isActive }
          : session
      ));

      toast({
        title: isActive ? 'Sesi Ditutup' : 'Sesi Dibuka',
        description: `Sesi kehadiran ${isActive ? 'ditutup' : 'dibuka'}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengubah status sesi',
        variant: 'destructive'
      });
    }
  };

  const markAttendanceManual = async (studentId: string, status: 'present' | 'late' | 'absent') => {
    try {
      setStudentAttendance(prev => prev.map(student => 
        student.id === studentId 
          ? { 
              ...student, 
              status, 
              check_in_time: status !== 'absent' ? format(new Date(), 'HH:mm') : undefined,
              check_in_method: 'manual'
            }
          : student
      ));

      toast({
        title: 'Kehadiran Diperbarui',
        description: 'Status kehadiran siswa berhasil diperbarui'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memperbarui kehadiran',
        variant: 'destructive'
      });
    }
  };

  const processAutoAbsent = async () => {
    try {
      const currentSession = sessions.find(s => s.id === selectedSession);
      if (!currentSession) return;

      const endTime = parseISO(`${currentSession.session_date}T${currentSession.end_time}`);
      const now = new Date();

      if (isAfter(now, endTime)) {
        // Mark all unchecked students as absent
        setStudentAttendance(prev => prev.map(student => 
          !student.check_in_time && student.status !== 'present' && student.status !== 'late'
            ? { ...student, status: 'absent' }
            : student
        ));

        toast({
          title: 'Auto Absent Diproses',
          description: 'Siswa yang tidak hadir otomatis ditandai sebagai tidak hadir'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memproses auto absent',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      present: { label: 'Hadir', variant: 'default' as const, icon: CheckCircle },
      late: { label: 'Terlambat', variant: 'secondary' as const, icon: Clock },
      absent: { label: 'Tidak Hadir', variant: 'destructive' as const, icon: AlertTriangle }
    };
    
    const statusConfig = config[status as keyof typeof config] || config.absent;
    const Icon = statusConfig.icon;
    
    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return <div>Memuat sistem kehadiran otomatis...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Sistem Kehadiran Otomatis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Kelola kehadiran siswa ekstrakurikuler dengan QR Code, Geofencing, dan sistem otomatis.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">Sesi Kehadiran</TabsTrigger>
          <TabsTrigger value="attendance">Detail Kehadiran</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card key={session.id} className={session.is_active ? 'border-green-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{session.extracurricular_name}</span>
                    <Badge variant={session.is_active ? 'default' : 'secondary'}>
                      {session.is_active ? 'Aktif' : 'Selesai'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(parseISO(session.session_date), 'dd MMM yyyy', { locale: id })}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{session.start_time} - {session.end_time}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{session.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{session.total_present}/{session.total_enrolled} ({session.attendance_rate}%)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedSession(session.id)}
                      >
                        Lihat Detail
                      </Button>
                      
                      {(hasRole('koordinator_ekstrakurikuler') || hasRole('admin')) && (
                        <Button 
                          size="sm"
                          variant={session.is_active ? "destructive" : "default"}
                          onClick={() => toggleSession(session.id, session.is_active)}
                        >
                          {session.is_active ? 'Tutup' : 'Buka'}
                        </Button>
                      )}
                    </div>

                    {session.is_active && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => generateQRCode(session.id)}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          Generate QR
                        </Button>
                      </div>
                    )}
                  </div>

                  {session.qr_code && session.is_active && (
                    <div className="mt-3 p-3 bg-gray-50 rounded text-center">
                      <div className="text-xs text-muted-foreground mb-2">QR Code:</div>
                      <div className="font-mono text-sm bg-white p-2 rounded border">
                        {session.qr_code}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          {selectedSession && (
            <Card>
              <CardHeader>
                <CardTitle>Detail Kehadiran - {sessions.find(s => s.id === selectedSession)?.extracurricular_name}</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={processAutoAbsent}>
                    Proses Auto Absent
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentAttendance.map((student) => (
                    <div key={student.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{student.student_name}</div>
                          <div className="text-sm text-muted-foreground">
                            NIS: {student.student_nis}
                            {student.check_in_time && ` • Check-in: ${student.check_in_time}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Method: {student.check_in_method.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(student.status)}
                          
                          {(hasRole('koordinator_ekstrakurikuler') || hasRole('admin') || hasRole('pelatih_ekstrakurikuler')) && (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markAttendanceManual(student.id, 'present')}
                              >
                                Hadir
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markAttendanceManual(student.id, 'late')}
                              >
                                Terlambat
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => markAttendanceManual(student.id, 'absent')}
                              >
                                Tidak Hadir
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Sistem Kehadiran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">QR Code Check-in</div>
                  <div className="text-sm text-muted-foreground">
                    Aktifkan check-in menggunakan QR Code
                  </div>
                </div>
                <Switch 
                  checked={qrCodeEnabled}
                  onCheckedChange={setQrCodeEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Geofencing</div>
                  <div className="text-sm text-muted-foreground">
                    Aktifkan check-in berdasarkan lokasi
                  </div>
                </div>
                <Switch 
                  checked={geofenceEnabled}
                  onCheckedChange={setGeofenceEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto Absent</div>
                  <div className="text-sm text-muted-foreground">
                    Otomatis tandai siswa sebagai tidak hadir setelah sesi berakhir
                  </div>
                </div>
                <Switch 
                  checked={autoAbsentEnabled}
                  onCheckedChange={setAutoAbsentEnabled}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Batas Waktu Terlambat (menit)</label>
                  <Input 
                    type="number" 
                    defaultValue="15"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Radius Geofence (meter)</label>
                  <Input 
                    type="number" 
                    defaultValue="50"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button className="w-full">
                Simpan Pengaturan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
