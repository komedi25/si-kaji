import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QRScanner } from '@/components/common/QRScanner';
import { QrCode, User, Clock, CheckCircle, AlertTriangle, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AttendanceRecord {
  id: string;
  student_name: string;
  nis: string;
  status: string;
  time_recorded: string;
  is_late: boolean;
  late_minutes?: number;
}

export const TPPKQRAttendance = () => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('student_attendances')
        .select(`
          id,
          status,
          recorded_at,
          students (
            full_name,
            nis
          )
        `)
        .eq('attendance_date', today)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      const records: AttendanceRecord[] = data?.map(record => {
        const recordTime = new Date(record.recorded_at);
        const schoolStartTime = new Date();
        schoolStartTime.setHours(7, 0, 0, 0); // 07:00 school start
        
        const isLate = recordTime > schoolStartTime && record.status === 'present';
        const lateMinutes = isLate ? Math.floor((recordTime.getTime() - schoolStartTime.getTime()) / 60000) : 0;

        return {
          id: record.id,
          student_name: record.students?.full_name || 'Unknown',
          nis: record.students?.nis || 'Unknown',
          status: isLate ? 'late' : record.status,
          time_recorded: record.recorded_at,
          is_late: isLate,
          late_minutes: lateMinutes > 0 ? lateMinutes : undefined
        };
      }) || [];

      setTodayRecords(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleQRScan = async (result: string) => {
    setLoading(true);
    try {
      // Parse QR code - assuming format: "NIS:student_id"
      const [nisPrefix, nisValue] = result.split(':');
      
      if (nisPrefix !== 'NIS' || !nisValue) {
        throw new Error('Format QR Code tidak valid. Harus format NIS:xxxxx');
      }

      // Find student by NIS
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, full_name, nis')
        .eq('nis', nisValue)
        .single();

      if (studentError || !studentData) {
        throw new Error('Siswa dengan NIS tersebut tidak ditemukan');
      }

      // Check if already recorded today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingRecord } = await supabase
        .from('student_attendances')
        .select('id')
        .eq('student_id', studentData.id)
        .eq('attendance_date', today)
        .single();

      if (existingRecord) {
        throw new Error(`${studentData.full_name} sudah tercatat presensi hari ini`);
      }

      // Calculate if late
      const now = new Date();
      const schoolStartTime = new Date();
      schoolStartTime.setHours(7, 0, 0, 0); // 07:00 school start
      
      const isLate = now > schoolStartTime;
      const lateMinutes = isLate ? Math.floor((now.getTime() - schoolStartTime.getTime()) / 60000) : 0;

      // Record attendance
      const { data: userData } = await supabase.auth.getUser();
      
      // Get student's class
      const { data: enrollmentData } = await supabase
        .from('student_enrollments')
        .select('class_id')
        .eq('student_id', studentData.id)
        .eq('status', 'active')
        .single();

      if (!enrollmentData?.class_id) {
        throw new Error('Siswa tidak terdaftar di kelas aktif');
      }
      
      const { error: insertError } = await supabase
        .from('student_attendances')
        .insert({
          student_id: studentData.id,
          class_id: enrollmentData.class_id,
          attendance_date: today,
          status: isLate ? 'late' : 'present',
          recorded_by: userData.user?.id,
          recorded_at: now.toISOString(),
          notes: isLate ? `Terlambat ${lateMinutes} menit` : null
        });

      if (insertError) throw insertError;

      // Update local state
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        student_name: studentData.full_name,
        nis: studentData.nis,
        status: isLate ? 'late' : 'present',
        time_recorded: now.toISOString(),
        is_late: isLate,
        late_minutes: lateMinutes > 0 ? lateMinutes : undefined
      };

      setTodayRecords(prev => [newRecord, ...prev]);

      toast({
        title: 'Berhasil!',
        description: `Presensi ${studentData.full_name} (${studentData.nis}) berhasil dicatat${isLate ? ` - Terlambat ${lateMinutes} menit` : ''}`,
        variant: isLate ? 'destructive' : 'default'
      });

      setIsScanning(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memproses QR Code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isLate: boolean, lateMinutes?: number) => {
    if (status === 'late' || isLate) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Terlambat {lateMinutes && `${lateMinutes}m`}
        </Badge>
      );
    }
    
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Hadir
      </Badge>
    );
  };

  const todayStats = {
    total: todayRecords.length,
    present: todayRecords.filter(r => r.status === 'present' && !r.is_late).length,
    late: todayRecords.filter(r => r.status === 'late' || r.is_late).length
  };

  return (
    <div className="space-y-6">
      {/* Header & Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Presensi QR Code - TPPK
          </CardTitle>
          <CardDescription>
            Scan QR Code pada kartu pelajar untuk input presensi otomatis dengan deteksi keterlambatan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Button
              onClick={() => setIsScanning(!isScanning)}
              className="flex items-center gap-2"
              variant={isScanning ? "destructive" : "default"}
              disabled={loading}
            >
              <Camera className="h-4 w-4" />
              {isScanning ? 'Tutup Scanner' : 'Buka Scanner QR'}
            </Button>
          </div>

          <QRScanner
            isOpen={isScanning}
            onClose={() => setIsScanning(false)}
            onScan={handleQRScan}
          />

          {loading && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Memproses data presensi...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Presensi Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), 'dd MMMM yyyy', { locale: id })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Hadir Tepat Waktu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{todayStats.present}</div>
            <p className="text-xs text-green-600">
              Sebelum 07:00
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Terlambat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{todayStats.late}</div>
            <p className="text-xs text-red-600">
              Setelah 07:00
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Presensi Terbaru Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada presensi yang tercatat hari ini
            </div>
          ) : (
            <div className="space-y-3">
              {todayRecords.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium">
                      {record.student_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{record.student_name}</div>
                      <div className="text-sm text-muted-foreground">NIS: {record.nis}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(record.status, record.is_late, record.late_minutes)}
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(record.time_recorded), 'HH:mm', { locale: id })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};