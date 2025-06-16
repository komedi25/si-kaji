
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGeolocation } from '@/hooks/useGeolocation';
import { AttendanceLocation, AttendanceSchedule, StudentSelfAttendance } from '@/types/selfAttendance';
import { MapPin, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const SelfAttendanceWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { location, loading: locationLoading, getCurrentLocation } = useGeolocation();
  
  const [student, setStudent] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<StudentSelfAttendance | null>(null);
  const [attendanceLocations, setAttendanceLocations] = useState<AttendanceLocation[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<AttendanceSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStudentData();
      fetchAttendanceData();
      fetchLocations();
      fetchTodaySchedule();
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchAttendanceData = async () => {
    if (!student?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('student_self_attendances')
        .select(`
          *,
          check_in_location:attendance_locations!check_in_location_id(*),
          check_out_location:attendance_locations!check_out_location_id(*)
        `)
        .eq('student_id', student.id)
        .eq('attendance_date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTodayAttendance(data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_locations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setAttendanceLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const dayOfWeek = new Date().getDay() || 7; // Convert Sunday (0) to 7
      const { data, error } = await supabase
        .from('attendance_schedules')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTodaySchedule(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLocationValidity = (userLat: number, userLng: number, targetLocation: AttendanceLocation): boolean => {
    const distance = calculateDistance(userLat, userLng, targetLocation.latitude, targetLocation.longitude);
    return distance <= targetLocation.radius_meters;
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const handleCheckIn = async () => {
    if (!student || !todaySchedule) return;

    setProcessing(true);
    try {
      const locationResult = await getCurrentLocation();
      
      if (!locationResult.granted || !locationResult.coords) {
        toast({
          title: "Error",
          description: locationResult.error || "Gagal mendapatkan lokasi",
          variant: "destructive"
        });
        return;
      }

      // Check if within any valid location
      const validLocation = attendanceLocations.find(loc => 
        checkLocationValidity(locationResult.coords!.latitude, locationResult.coords!.longitude, loc)
      );

      if (!validLocation) {
        toast({
          title: "Lokasi Tidak Valid",
          description: "Anda harus berada di area sekolah untuk melakukan presensi",
          variant: "destructive"
        });
        return;
      }

      const currentTime = new Date().toTimeString().split(' ')[0];
      const currentDate = new Date().toISOString().split('T')[0];

      // Create or update attendance record
      const attendanceData = {
        student_id: student.id,
        attendance_date: currentDate,
        check_in_time: currentTime,
        check_in_location_id: validLocation.id,
        check_in_latitude: locationResult.coords.latitude,
        check_in_longitude: locationResult.coords.longitude,
        status: 'present'
      };

      const { data, error } = await supabase
        .from('student_self_attendances')
        .upsert(attendanceData, {
          onConflict: 'student_id,attendance_date'
        })
        .select()
        .single();

      if (error) throw error;

      setTodayAttendance(data);
      toast({
        title: "Check-in Berhasil",
        description: `Presensi masuk berhasil di ${validLocation.name}`,
        variant: "default"
      });

      fetchAttendanceData(); // Refresh data
    } catch (error) {
      console.error('Error during check-in:', error);
      toast({
        title: "Error",
        description: "Gagal melakukan check-in",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!student || !todayAttendance) return;

    setProcessing(true);
    try {
      const locationResult = await getCurrentLocation();
      
      if (!locationResult.granted || !locationResult.coords) {
        toast({
          title: "Error",
          description: locationResult.error || "Gagal mendapatkan lokasi",
          variant: "destructive"
        });
        return;
      }

      const validLocation = attendanceLocations.find(loc => 
        checkLocationValidity(locationResult.coords!.latitude, locationResult.coords!.longitude, loc)
      );

      if (!validLocation) {
        toast({
          title: "Lokasi Tidak Valid",
          description: "Anda harus berada di area sekolah untuk melakukan presensi",
          variant: "destructive"
        });
        return;
      }

      const currentTime = new Date().toTimeString().split(' ')[0];

      const { data, error } = await supabase
        .from('student_self_attendances')
        .update({
          check_out_time: currentTime,
          check_out_location_id: validLocation.id,
          check_out_latitude: locationResult.coords.latitude,
          check_out_longitude: locationResult.coords.longitude
        })
        .eq('id', todayAttendance.id)
        .select()
        .single();

      if (error) throw error;

      setTodayAttendance(data);
      toast({
        title: "Check-out Berhasil",
        description: `Presensi pulang berhasil di ${validLocation.name}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error during check-out:', error);
      toast({
        title: "Error",
        description: "Gagal melakukan check-out",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Hadir</Badge>;
      case 'late':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Terlambat</Badge>;
      case 'absent':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Tidak Hadir</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isWeekend = () => {
    const day = new Date().getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Memuat data presensi...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Data siswa tidak ditemukan. Hubungi administrator.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isWeekend()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Presensi Mandiri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Presensi tidak tersedia di akhir pekan.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!todaySchedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Presensi Mandiri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Tidak ada jadwal presensi untuk hari ini.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Presensi Mandiri
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Jadwal Hari Ini */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Jadwal Hari Ini</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Masuk: </span>
              <span className="font-medium">{todaySchedule.check_in_start.slice(0, 5)} - {todaySchedule.check_in_end.slice(0, 5)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pulang: </span>
              <span className="font-medium">{todaySchedule.check_out_start.slice(0, 5)} - {todaySchedule.check_out_end.slice(0, 5)}</span>
            </div>
          </div>
        </div>

        {/* Status Presensi Hari Ini */}
        {todayAttendance && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Status Hari Ini</h4>
              {getStatusBadge(todayAttendance.status)}
            </div>
            <div className="space-y-1 text-sm">
              {todayAttendance.check_in_time && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Masuk: {todayAttendance.check_in_time.slice(0, 5)}</span>
                </div>
              )}
              {todayAttendance.check_out_time && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Pulang: {todayAttendance.check_out_time.slice(0, 5)}</span>
                </div>
              )}
              {todayAttendance.violation_created && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Pelanggaran terlambat tercatat</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tombol Presensi */}
        <div className="space-y-2">
          {!todayAttendance?.check_in_time && (
            <Button 
              onClick={handleCheckIn}
              disabled={processing || locationLoading}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Presensi Masuk
            </Button>
          )}

          {todayAttendance?.check_in_time && !todayAttendance?.check_out_time && (
            <Button 
              onClick={handleCheckOut}
              disabled={processing || locationLoading}
              className="w-full"
              variant="outline"
              size="lg"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Presensi Pulang
            </Button>
          )}
        </div>

        {/* Info Lokasi */}
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>Pastikan Anda berada di area sekolah</span>
          </div>
          {attendanceLocations.length > 0 && (
            <div className="mt-1">
              Lokasi valid: {attendanceLocations.map(loc => loc.name).join(', ')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
